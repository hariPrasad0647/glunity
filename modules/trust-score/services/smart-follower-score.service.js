const { Op } = require('sequelize');
const Follow = require('../../user/models/follow.model');
const TrustScore = require('../models/trust-score.model');
const { MVP_CONFIG } = require('../constants/trust-score.constants');

/**
 * Smart Follower Score Service (20% of total)
 * 
 * A Smart Follower has a stored TrustScore >= 65.
 * Active platform activity is inherently handled by the Trust Score 
 * longevity decay of the followers.
 * 
 * IMPORTANT: This explicitly queries the database for the *stored* TrustScore 
 * to ensure deterministic weekly batch calculations without calculation-order dependency.
 */
const calculateSmartFollowerScore = async (userId) => {
  // 1. Get all followers
  const followers = await Follow.findAll({
    where: { followingId: userId },
    attributes: ['followerId']
  });

  const totalFollowers = followers.length;
  if (totalFollowers === 0) return 0;

  const followerIds = followers.map(f => f.followerId);

  // 2. Find which of these followers have a high enough Trust Score
  const smartFollowersCount = await TrustScore.count({
    where: {
      userId: { [Op.in]: followerIds },
      finalScore: {
        [Op.gte]: MVP_CONFIG.SMART_FOLLOWER_MIN_TRUST_SCORE
      }
    }
  });

  // 3. Calculate score based on ratio and volume.
  // Ratio: smartFollowers / totalFollowers
  // Volume Factor: Need at least 50 smart followers for full multiplier
  const ratio = smartFollowersCount / totalFollowers;
  const volumeFactor = Math.min(1, smartFollowersCount / 50);

  let score = (ratio * 100) * volumeFactor;
  
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
};

module.exports = {
  calculateSmartFollowerScore,
};
