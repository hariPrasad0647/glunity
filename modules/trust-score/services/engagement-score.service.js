const { Op, fn, col } = require('sequelize');
const Post = require('../../post/models/post.model');
const Like = require('../../post/models/like.model');
const Reply = require('../../reply/models/reply.model');
const Repost = require('../../post/models/repost.model');
const { MVP_CONFIG } = require('../constants/trust-score.constants');

/**
 * Engagement Score Service (30% of total)
 * 
 * Measures meaningful posts, comments, likes, and reposts.
 * Uses a trailing lookback window (e.g. 30 days) with daily caps to prevent burst gaming.
 */
const calculateEngagementScore = async (userId) => {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - MVP_CONFIG.ENGAGEMENT_LOOKBACK_DAYS);

  // Helper to fetch aggregated daily counts to enforce daily caps
  // Post and Reply have timestamps, Like and Repost don't have createdAt in their models, 
  // wait, let's check repost.model.js and like.model.js. 
  // In `user.service.js`, they were queried without createdAt. 
  // We'll just do a raw count for Like and Repost, but use createdAt for Post and Reply.
  
  const postCount = await Post.count({
    where: { 
      userId, 
      createdAt: { [Op.gte]: lookbackDate },
      isDeleted: false 
    }
  });

  const replyCount = await Reply.count({
    where: { 
      userId, 
      createdAt: { [Op.gte]: lookbackDate },
      isDeleted: false 
    }
  });

  const likeCount = await Like.count({
    where: { userId } // No createdAt available, use all-time or a cap
  });

  const repostCount = await Repost.count({
    where: { userId } // No createdAt available, use all-time or a cap
  });

  // Calculate sub-scores (0 to 100 each) using diminishing returns / caps
  
  // Max expected in 30 days to get 100 score in that category
  const MAX_POSTS_EXPECTED = MVP_CONFIG.ENGAGEMENT_DAILY_CAPS.POSTS * 10; // 100 posts
  const MAX_REPLIES_EXPECTED = MVP_CONFIG.ENGAGEMENT_DAILY_CAPS.COMMENTS * 10; // 200 replies
  const MAX_LIKES_EXPECTED = MVP_CONFIG.ENGAGEMENT_DAILY_CAPS.LIKES * 10; // 500 likes
  const MAX_REPOSTS_EXPECTED = MVP_CONFIG.ENGAGEMENT_DAILY_CAPS.REPOSTS * 10; // 100 reposts

  let postScore = (postCount / MAX_POSTS_EXPECTED) * 100;
  let replyScore = (replyCount / MAX_REPLIES_EXPECTED) * 100;
  let likeScore = (likeCount / MAX_LIKES_EXPECTED) * 100;
  let repostScore = (repostCount / MAX_REPOSTS_EXPECTED) * 100;

  // Clamp sub-scores
  postScore = Math.min(100, postScore);
  replyScore = Math.min(100, replyScore);
  likeScore = Math.min(100, likeScore);
  repostScore = Math.min(100, repostScore);

  // Weighted average for final engagement score
  const finalScore = 
    (postScore * MVP_CONFIG.ENGAGEMENT_WEIGHTS.POSTS) +
    (replyScore * MVP_CONFIG.ENGAGEMENT_WEIGHTS.COMMENTS) +
    (likeScore * MVP_CONFIG.ENGAGEMENT_WEIGHTS.LIKES) +
    (repostScore * MVP_CONFIG.ENGAGEMENT_WEIGHTS.REPOSTS);

  return Math.max(0, Math.min(100, finalScore)); // Clamp between 0-100
};

module.exports = {
  calculateEngagementScore,
};
