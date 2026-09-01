const Like = require('../models/like.model');
const Bookmark = require('../models/bookmark.model');
const Repost = require('../models/repost.model');
const Post = require('../models/post.model');
const Reel = require('../../reel/models/reel.model');
const Reply = require('../../reply/models/reply.model');

const findContent = async (contentType, contentId) => {
  const model = contentType === 'post' ? Post : Reel;
  const content = await model.findByPk(contentId);
  if (!content) {
    const err = new Error(`${contentType === 'post' ? 'Post' : 'Reel'} not found`);
    err.status = 404;
    throw err;
  }
  return content;
};

// ── Like ──────────────────────────────────────────────────────────────────────

const toggleLike = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  const existing = await Like.findOne({ where: { userId, contentType, contentId } });
  if (existing) {
    await existing.destroy();
  } else {
    await Like.create({ userId, contentType, contentId });
  }
  const likeCount = await Like.count({ where: { contentType, contentId } });
  
  if (contentType === 'post') {
    await Post.update({ likeCount }, { where: { id: contentId } });
  }
  
  return { liked: !existing, likeCount };
};

// ── Bookmark ───────────────────────────────────────────────────────────────────

const toggleBookmark = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  const existing = await Bookmark.findOne({ where: { userId, contentType, contentId } });

  if (existing) {
    await existing.destroy();
  } else {
    await Bookmark.create({ userId, contentType, contentId });
  }

  const bookmarkCount = await Bookmark.count({ where: { contentType, contentId } });
  
  if (contentType === 'post') {
    await Post.update({ bookmarkCount }, { where: { id: contentId } });
  }

  return { bookmarked: !existing, bookmarkCount };
};

// ── Repost ─────────────────────────────────────────────────────────────────────

const repostContent = async (userId, contentType, contentId) => {
  await findContent(contentType, contentId);
  await Repost.findOrCreate({ where: { userId, contentType, contentId } });
  const repostCount = await Repost.count({ where: { contentType, contentId } });
  
  if (contentType === 'post') {
    await Post.update({ repostCount }, { where: { id: contentId } });
  }
  
  return { repostCount };
};

// ── Stats (used by GET post/reel endpoints) ───────────────────────────────────

const getInteractionStats = async (contentType, contentId, viewerId = null) => {
  const [likeCount, bookmarkCount, repostCount, commentCount, likeRow, bookmarkRow] = await Promise.all([
    Like.count({ where: { contentType, contentId } }),
    Bookmark.count({ where: { contentType, contentId } }),
    Repost.count({ where: { contentType, contentId } }),
    Reply.count({ where: { contentType, contentId, parentId: null, isDeleted: false } }),
    viewerId ? Like.findOne({ where: { userId: viewerId, contentType, contentId } }) : null,
    viewerId ? Bookmark.findOne({ where: { userId: viewerId, contentType, contentId } }) : null,
  ]);
  return {
    likeCount,
    bookmarkCount,
    repostCount,
    commentCount,
    hasLiked: !!likeRow,
    hasBookmarked: !!bookmarkRow,
  };
};

// ── Saved content lists ───────────────────────────────────────────────────────

const getBookmarkedPosts = async (userId, { page = 1, limit = 12 } = {}) => {
  const { getPostById, formatPost } = require('./post.service');
  const offset = (page - 1) * limit;
  const { count, rows: bookmarks } = await Bookmark.findAndCountAll({
    where: { userId, contentType: 'post' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const posts = await Promise.all(bookmarks.map(({ contentId }) => getPostById(contentId)));
  return posts.filter(Boolean).map((p) => formatPost(p));
};

const getSavedReels = async (userId) => {
  const { getReelById, formatReel } = require('../../reel/services/reel.service');
  const saves = await Bookmark.findAll({
    where: { userId, contentType: 'reel' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const reels = await Promise.all(saves.map(({ contentId }) => getReelById(contentId)));
  return reels.filter(Boolean).map((r) => formatReel(r));
};

const getMyLikedPosts = async (userId, { page = 1, limit = 12 } = {}) => {
  const { getPostById, formatPost } = require('./post.service');
  const offset = (page - 1) * limit;
  const likes = await Like.findAll({
    where: { userId, contentType: 'post' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    raw: true,
  });
  const posts = await Promise.all(likes.map(({ contentId }) => getPostById(contentId)));
  return posts.filter(Boolean).map((p) => formatPost(p));
};

const getMyLikedReels = async (userId, { page = 1, limit = 12 } = {}) => {
  const { getReelById, formatReel } = require('../../reel/services/reel.service');
  const offset = (page - 1) * limit;
  const likes = await Like.findAll({
    where: { userId, contentType: 'reel' },
    attributes: ['contentId'],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    raw: true,
  });
  const reels = await Promise.all(likes.map(({ contentId }) => getReelById(contentId)));
  return reels.filter(Boolean).map((r) => formatReel(r));
};

module.exports = {
  toggleLike,
  toggleBookmark,
  repostContent,
  getInteractionStats,
  getSavedPosts: getBookmarkedPosts,
  getSavedReels,
  getMyLikedPosts,
  getMyLikedReels,
};
