const TrustScore = require('../models/trust-score.model');
const TrustScoreHistory = require('../models/trust-score-history.model');
const { calculateOnChainScore } = require('./on-chain-score.service');
const { calculateSmartFollowerScore } = require('./smart-follower-score.service');
const { calculateEngagementScore } = require('./engagement-score.service');
const { calculateLongevityScore } = require('./longevity-score.service');
const { calculateReportScore } = require('./report-score.service');

const {
  TRUST_SCORE_WEIGHTS,
  TRUST_SCORE_LIMITS,
  MONETIZATION_THRESHOLD,
  TIERS,
  CALCULATION_REASONS,
} = require('../constants/trust-score.constants');

const getTrustScoreTier = (score) => {
  const rounded = Math.round(score);
  for (const tier of TIERS) {
    if (rounded >= tier.min && rounded <= tier.max) {
      return tier.name;
    }
  }
  return 'UNVERIFIED';
};

const isMonetizationEligible = (score) => {
  return score >= MONETIZATION_THRESHOLD;
};

/**
 * Recalculate a user's Trust Score.
 * 
 * @param {string} userId - UUID of the user
 * @param {string} calculationReason - Reason for calculation (e.g. 'WEEKLY')
 * @returns {Object} The complete Trust Score object
 */
const recalculateTrustScore = async (userId, calculationReason = CALCULATION_REASONS.WEEKLY) => {
  // 1. Calculate the 5 component scores in parallel
  const [
    onChainScore,
    smartFollowersScore,
    engagementScore,
    longevityScore,
    reportsScore
  ] = await Promise.all([
    calculateOnChainScore(userId),
    calculateSmartFollowerScore(userId),
    calculateEngagementScore(userId),
    calculateLongevityScore(userId),
    calculateReportScore(userId),
  ]);

  // 2. Weighted Sum
  let finalScore = 
    (onChainScore * TRUST_SCORE_WEIGHTS.ON_CHAIN) +
    (smartFollowersScore * TRUST_SCORE_WEIGHTS.SMART_FOLLOWERS) +
    (engagementScore * TRUST_SCORE_WEIGHTS.ENGAGEMENT) +
    (longevityScore * TRUST_SCORE_WEIGHTS.LONGEVITY) +
    (reportsScore * TRUST_SCORE_WEIGHTS.REPORTS);

  // 3. Clamp
  finalScore = Math.max(TRUST_SCORE_LIMITS.MIN, Math.min(TRUST_SCORE_LIMITS.MAX, finalScore));

  // 4. Resolve Tier & Monetization
  const tier = getTrustScoreTier(finalScore);
  const monetizationEligible = isMonetizationEligible(finalScore);

  // 5. Update Current Record (Upsert)
  const [trustScoreRecord] = await TrustScore.upsert({
    userId,
    onChainScore,
    smartFollowersScore,
    engagementScore,
    longevityScore,
    reportsScore,
    finalScore,
    tier,
    monetizationEligible,
    calculatedAt: new Date(),
  });

  // 6. Record History
  await TrustScoreHistory.create({
    userId,
    onChainScore,
    smartFollowersScore,
    engagementScore,
    longevityScore,
    reportsScore,
    finalScore,
    tier,
    calculationReason,
  });

  return trustScoreRecord;
};

/**
 * Fetch current Trust Score without recalculating
 */
const getTrustScore = async (userId) => {
  let score = await TrustScore.findOne({ where: { userId } });
  
  // If the user doesn't have a score yet, calculate it initially
  if (!score) {
    score = await recalculateTrustScore(userId, CALCULATION_REASONS.MANUAL_RECALCULATION);
  }
  
  return score;
};

module.exports = {
  recalculateTrustScore,
  getTrustScore,
  getTrustScoreTier,
  isMonetizationEligible,
};
