const { Op, fn, col, literal } = require('sequelize');
const PointTransaction = require('../models/pointTransaction.model');
const { ACTIVITY_TYPES, POINT_VALUES, ACTIVITY_DESCRIPTIONS } = require('../constants/activity.constants');
const logger = require('../../../utils/logger');

/**
 * Core award function — the single entry point for all point awards.
 *
 * @param {object} opts
 * @param {string} opts.userId        — the user receiving the points
 * @param {string} opts.activityType  — one of ACTIVITY_TYPES
 * @param {string} opts.idempotencyKey — unique key preventing duplicate awards
 * @param {string} [opts.referenceType] — e.g. 'post', 'reply', 'message'
 * @param {string} [opts.referenceId]   — UUID of the related entity
 * @returns {{ awarded: boolean, points: number, transaction: object|null }}
 */
const award = async ({
  userId,
  activityType,
  idempotencyKey,
  referenceType = null,
  referenceId = null,
}) => {
  const points = POINT_VALUES[activityType];
  if (!points) {
    logger.warn(`[PointsService] Unknown activityType: ${activityType}`);
    return { awarded: false, points: 0, transaction: null };
  }

  try {
    const [transaction, created] = await PointTransaction.findOrCreate({
      where: { idempotencyKey },
      defaults: {
        userId,
        activityType,
        points,
        referenceType,
        referenceId,
        description: ACTIVITY_DESCRIPTIONS[activityType],
        idempotencyKey,
      },
    });

    if (!created) {
      // Already awarded — idempotent no-op
      return { awarded: false, points: 0, transaction: null };
    }

    logger.info(`[PointsService] Awarded ${points} pts (${activityType}) to user ${userId}`);
    return { awarded: true, points, transaction };
  } catch (err) {
    // Unique constraint violation from a race condition — treat as already awarded
    if (err.name === 'SequelizeUniqueConstraintError') {
      return { awarded: false, points: 0, transaction: null };
    }
    // Log but never throw — point failures must not break the primary action
    logger.error(`[PointsService] Failed to award points: ${err.message}`);
    return { awarded: false, points: 0, transaction: null };
  }
};

// ── Convenience wrappers ────────────────────────────────────────────────────

const awardProfileSetup = (userId) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.PROFILE_SETUP,
    idempotencyKey: `PROFILE_SETUP:${userId}`,
    referenceType: 'user',
    referenceId: userId,
  });

const awardQualityPost = (userId, postId) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.QUALITY_POST,
    idempotencyKey: `QUALITY_POST:${postId}`,
    referenceType: 'post',
    referenceId: postId,
  });

const awardReceivedLike = (postOwnerId, contentId, likerId) =>
  award({
    userId: postOwnerId,
    activityType: ACTIVITY_TYPES.RECEIVED_LIKE,
    idempotencyKey: `RECEIVED_LIKE:${contentId}:${likerId}`,
    referenceType: 'post',
    referenceId: contentId,
  });

const awardComment = (userId, replyId) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.COMMENT,
    idempotencyKey: `COMMENT:${replyId}`,
    referenceType: 'reply',
    referenceId: replyId,
  });

const awardRepost = (userId, contentId) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.REPOST,
    idempotencyKey: `REPOST:${userId}:${contentId}`,
    referenceType: 'post',
    referenceId: contentId,
  });

const awardDailyActivity = (userId, dateStr) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.DAILY_ACTIVITY,
    idempotencyKey: `DAILY_ACTIVITY:${userId}:${dateStr}`,
    referenceType: 'user',
    referenceId: userId,
  });

const awardChatMessage = (userId, messageId) =>
  award({
    userId,
    activityType: ACTIVITY_TYPES.CHAT_MESSAGE,
    idempotencyKey: `CHAT_MESSAGE:${messageId}`,
    referenceType: 'message',
    referenceId: messageId,
  });

// ── Query functions ─────────────────────────────────────────────────────────

/**
 * Total lifetime points + current calendar-month points for a user.
 */
const getSummary = async (userId) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [totalResult, monthResult] = await Promise.all([
    PointTransaction.findOne({
      where: { userId },
      attributes: [[fn('COALESCE', fn('SUM', col('points')), 0), 'total']],
      raw: true,
    }),
    PointTransaction.findOne({
      where: {
        userId,
        createdAt: { [Op.gte]: monthStart },
      },
      attributes: [[fn('COALESCE', fn('SUM', col('points')), 0), 'total']],
      raw: true,
    }),
  ]);

  return {
    total_points: Number(totalResult?.total ?? 0),
    current_month_points: Number(monthResult?.total ?? 0),
  };
};

/**
 * Paginated point transaction history.
 */
const getHistory = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await PointTransaction.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
    raw: true,
  });

  return {
    transactions: rows.map((t) => ({
      id: t.id,
      activityType: t.activityType,
      points: t.points,
      description: t.description,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      createdAt: t.createdAt,
    })),
    total: count,
    page: Number(page),
    limit: Number(limit),
  };
};

/**
 * Historical monthly totals — groups all transactions by year+month.
 */
const getMonthlyHistory = async (userId) => {
  const rows = await PointTransaction.findAll({
    where: { userId },
    attributes: [
      [fn('YEAR', col('createdAt')), 'year'],
      [fn('MONTH', col('createdAt')), 'month'],
      [fn('SUM', col('points')), 'points'],
    ],
    group: [fn('YEAR', col('createdAt')), fn('MONTH', col('createdAt'))],
    order: [
      [fn('YEAR', col('createdAt')), 'DESC'],
      [fn('MONTH', col('createdAt')), 'DESC'],
    ],
    raw: true,
  });

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return rows.map((r) => ({
    year: Number(r.year),
    month: Number(r.month),
    label: `${MONTH_NAMES[Number(r.month) - 1]} ${r.year}`,
    points: Number(r.points),
  }));
};

module.exports = {
  award,
  awardProfileSetup,
  awardQualityPost,
  awardReceivedLike,
  awardComment,
  awardRepost,
  awardDailyActivity,
  awardChatMessage,
  getSummary,
  getHistory,
  getMonthlyHistory,
};
