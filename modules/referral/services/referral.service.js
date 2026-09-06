const { Op } = require('sequelize');
const Referral = require('../models/referral.model');
const { award } = require('../../points/services/points.service');
const { ACTIVITY_TYPES } = require('../../points/constants/activity.constants');
const logger = require('../../../utils/logger');

const checkCompletion = async (referral) => {
  if (referral.status !== 'PENDING') return;
  if (!referral.profileCompletedAt || !referral.firstPostAt) return;

  // Both requirements are met, attempt to award points
  const { awarded, points } = await award({
    userId: referral.referrerId,
    activityType: ACTIVITY_TYPES.REFERRAL,
    idempotencyKey: `REFERRAL:${referral.id}`,
    referenceType: 'REFERRAL',
    referenceId: referral.id,
  });

  if (awarded) {
    referral.status = 'COMPLETED';
    referral.pointsAwarded = points;
    referral.completedAt = new Date();
    await referral.save();
    logger.info(`[ReferralService] Referral ${referral.id} completed. Awarded ${points} to user ${referral.referrerId}`);
  }
};

const markProfileCompleted = async (userId) => {
  try {
    const referral = await Referral.findOne({
      where: { referredUserId: userId, status: 'PENDING', profileCompletedAt: null },
    });
    if (!referral) return;

    referral.profileCompletedAt = new Date();
    await referral.save();
    
    await checkCompletion(referral);
  } catch (error) {
    logger.error(`[ReferralService] Error in markProfileCompleted for user ${userId}:`, error);
  }
};

const markFirstPost = async (userId) => {
  try {
    const referral = await Referral.findOne({
      where: { referredUserId: userId, status: 'PENDING', firstPostAt: null },
    });
    if (!referral) return;

    referral.firstPostAt = new Date();
    await referral.save();
    
    await checkCompletion(referral);
  } catch (error) {
    logger.error(`[ReferralService] Error in markFirstPost for user ${userId}:`, error);
  }
};

const flagReferral = async (referralId, reason) => {
  const referral = await Referral.findByPk(referralId);
  if (referral) {
    referral.flagged = true;
    referral.flagReason = reason;
    await referral.save();
  }
  return referral;
};

module.exports = {
  markProfileCompleted,
  markFirstPost,
  flagReferral,
};
