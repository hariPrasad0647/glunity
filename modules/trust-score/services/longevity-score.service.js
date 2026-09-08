const User = require('../../user/models/user.model');
const Post = require('../../post/models/post.model');
const Like = require('../../post/models/like.model');
const Reply = require('../../reply/models/reply.model');
const { MVP_CONFIG } = require('../constants/trust-score.constants');
const { Op } = require('sequelize');

/**
 * Longevity Score Service (20% of total)
 * 
 * Rewards long-term active accounts.
 * Decays gradually if the user is inactive.
 */
const calculateLongevityScore = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['createdAt'] });
  if (!user) return 0;

  const now = new Date();
  const accountAgeMs = now - new Date(user.createdAt);
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

  // 1. Calculate Base Score based on account age
  // E.g., reaches 100 after 365 days.
  let baseScore = (accountAgeDays / MVP_CONFIG.LONGEVITY.MAX_DAYS) * 100;
  baseScore = Math.max(0, Math.min(100, baseScore)); // clamp to 0-100

  // 2. Calculate Inactivity Decay
  // Find the most recent activity across posts, likes, and replies
  const [latestPost, latestLike, latestReply] = await Promise.all([
    Post.findOne({ where: { userId }, order: [['createdAt', 'DESC']], attributes: ['createdAt'] }),
    Like.findOne({ where: { userId }, order: [['id', 'DESC']] }), // Like has no createdAt, but id is sequential or UUID? Wait, like.model.js has no timestamps. Oh, we might not have a reliable date for likes. Let's rely on posts and replies.
    Reply.findOne({ where: { userId }, order: [['createdAt', 'DESC']], attributes: ['createdAt'] }),
  ]);

  let lastActivityDate = user.createdAt; // Default to account creation

  if (latestPost && new Date(latestPost.createdAt) > new Date(lastActivityDate)) {
    lastActivityDate = latestPost.createdAt;
  }
  if (latestReply && new Date(latestReply.createdAt) > new Date(lastActivityDate)) {
    lastActivityDate = latestReply.createdAt;
  }
  
  // Note: Since Like model lacks timestamps, we rely on Posts and Replies for activity tracking.
  // In a robust system, we would add createdAt to likes.

  const inactivityMs = now - new Date(lastActivityDate);
  const inactivityDays = Math.floor(inactivityMs / (1000 * 60 * 60 * 24));

  let decay = 0;
  if (inactivityDays > MVP_CONFIG.LONGEVITY.INACTIVITY_GRACE_PERIOD_DAYS) {
    const decayDays = inactivityDays - MVP_CONFIG.LONGEVITY.INACTIVITY_GRACE_PERIOD_DAYS;
    decay = decayDays * MVP_CONFIG.LONGEVITY.INACTIVITY_DECAY_RATE_PER_DAY;
    decay = Math.min(decay, MVP_CONFIG.LONGEVITY.MAX_INACTIVITY_DECAY);
  }

  // 3. Final calculation
  let score = baseScore - decay;
  
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
};

module.exports = {
  calculateLongevityScore,
};
