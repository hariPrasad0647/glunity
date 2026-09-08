const cron = require('node-cron');
const User = require('../../user/models/user.model');
const { recalculateTrustScore } = require('../services/trust-score.service');
const { CALCULATION_REASONS } = require('../constants/trust-score.constants');
const logger = require('../../../utils/logger');

/**
 * Runs the weekly Trust Score calculation for all active users.
 * Processes users in batches to avoid locking the database.
 */
const runWeeklyTrustScoreCalculation = async () => {
  logger.info('[TrustScore] Starting weekly Trust Score calculation batch...');

  try {
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await User.findAll({
        attributes: ['id'],
        limit,
        offset,
        order: [['id', 'ASC']]
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        try {
          await recalculateTrustScore(user.id, CALCULATION_REASONS.WEEKLY);
        } catch (error) {
          logger.error(`[TrustScore] Failed to calculate score for user ${user.id}:`, error.message);
          // Continue processing next user instead of crashing the batch
        }
      }

      offset += limit;
    }

    logger.info('[TrustScore] Weekly Trust Score calculation batch completed successfully.');
  } catch (error) {
    logger.error('[TrustScore] Fatal error in Trust Score batch process:', error.message);
  }
};

/**
 * Initialize the weekly cron scheduler using node-cron.
 * '0 0 * * 0' = Every Sunday at midnight
 */
const initTrustScoreScheduler = () => {
  cron.schedule('0 0 * * 0', () => {
    runWeeklyTrustScoreCalculation();
  });

  logger.info('[TrustScore] Weekly scheduler initialized (node-cron).');
};

module.exports = {
  runWeeklyTrustScoreCalculation,
  initTrustScoreScheduler,
};
