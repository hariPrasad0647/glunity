const { getTrustScore } = require('../services/trust-score.service');
const TrustScoreHistory = require('../models/trust-score-history.model');
const { TRUST_SCORE_WEIGHTS } = require('../constants/trust-score.constants');
const { success, error } = require('../../../utils/response');

const getMyTrustScoreController = async (req, res, next) => {
  try {
    const score = await getTrustScore(req.user.id);

    return success(res, 200, 'Trust score fetched successfully', {
      score: Math.round(score.finalScore),
      tier: score.tier,
      monetizationEligible: score.monetizationEligible,
      components: {
        onChain: Math.round(score.onChainScore),
        smartFollowers: Math.round(score.smartFollowersScore),
        engagement: Math.round(score.engagementScore),
        longevity: Math.round(score.longevityScore),
        reports: Math.round(score.reportsScore),
      },
      weights: {
        onChain: TRUST_SCORE_WEIGHTS.ON_CHAIN * 100,
        smartFollowers: TRUST_SCORE_WEIGHTS.SMART_FOLLOWERS * 100,
        engagement: TRUST_SCORE_WEIGHTS.ENGAGEMENT * 100,
        longevity: TRUST_SCORE_WEIGHTS.LONGEVITY * 100,
        reports: TRUST_SCORE_WEIGHTS.REPORTS * 100,
      },
      calculatedAt: score.calculatedAt,
    });
  } catch (err) {
    next(err);
  }
};

const getMyTrustScoreHistoryController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await TrustScoreHistory.findAndCountAll({
      where: { userId: req.user.id },
      order: [['calculatedAt', 'DESC']],
      limit,
      offset,
      attributes: ['finalScore', 'tier', 'calculationReason', 'calculatedAt'], // Only return public-safe history fields
    });

    return success(res, 200, 'Trust score history fetched successfully', {
      history: rows,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTrustScoreController,
  getMyTrustScoreHistoryController,
};
