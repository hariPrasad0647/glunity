const Reply = require('../models/reply.model');
const ReplyLike = require('../models/reply_like.model');
const User = require('../../user/models/user.model');
const Post = require('../../post/models/post.model');
const Reel = require('../../reel/models/reel.model');

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

const getReplyStats = async (replyId, viewerId) => {
  const [likeCount, likeRow, nestedReplyCount] = await Promise.all([
    ReplyLike.count({ where: { replyId } }),
    viewerId ? ReplyLike.findOne({ where: { userId: viewerId, replyId } }) : null,
    Reply.count({ where: { parentId: replyId, isDeleted: false } }),
  ]);
  return { likeCount, hasLiked: !!likeRow, replyCount: nestedReplyCount };
};

const formatReply = (reply, stats = {}) => {
  if (reply.isDeleted) {
    return {
      id: reply.id,
      text: null,
      isDeleted: true,
      createdAt: reply.createdAt,
      parentId: reply.parentId || null,
      author: null,
      likeCount: 0,
      hasLiked: false,
      replyCount: stats.replyCount ?? 0,
    };
  }
  return {
    id: reply.id,
    text: reply.text,
    isDeleted: false,
    createdAt: reply.createdAt,
    parentId: reply.parentId || null,
    author: {
      id: reply.author.id,
      username: reply.author.username,
      profileImage: reply.author.profileImage || null,
    },
    likeCount: stats.likeCount ?? 0,
    hasLiked: stats.hasLiked ?? false,
    replyCount: stats.replyCount ?? 0,
  };
};

const addReply = async (userId, contentType, contentId, text, parentId = null) => {
  await findContent(contentType, contentId);

  if (parentId) {
    const parent = await Reply.findOne({ where: { id: parentId, contentType, contentId } });
    if (!parent) {
      const err = new Error('Parent reply not found');
      err.status = 404;
      throw err;
    }
    if (parent.parentId) {
      const err = new Error('Cannot reply to a nested reply');
      err.status = 400;
      throw err;
    }
  }

  const reply = await Reply.create({ userId, contentType, contentId, text, parentId });
  
  if (contentType === 'post' && !parentId) {
    const replyCount = await Reply.count({ where: { contentType: 'post', contentId, parentId: null, isDeleted: false } });
    await Post.update({ replyCount }, { where: { id: contentId } });
  }
  
  const full = await Reply.findByPk(reply.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
  });
  return formatReply(full, { likeCount: 0, hasLiked: false, replyCount: 0 });
};

const getReplies = async (contentType, contentId, viewerId, { page = 1, limit = 20 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await Reply.findAndCountAll({
    where: { contentType, contentId, parentId: null },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  const replies = await Promise.all(
    rows.map(async (c) => {
      const stats = await getReplyStats(c.id, viewerId);
      return formatReply(c, stats);
    })
  );

  return { replies, total: count, page: Number(page), limit: Number(limit) };
};

const getNestedReplies = async (replyId, viewerId, { page = 1, limit = 20 } = {}) => {
  const parent = await Reply.findByPk(replyId);
  if (!parent) {
    const err = new Error('Reply not found');
    err.status = 404;
    throw err;
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await Reply.findAndCountAll({
    where: { parentId: replyId },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
    order: [['createdAt', 'ASC']],
    limit: Number(limit),
    offset,
  });

  const replies = await Promise.all(
    rows.map(async (c) => {
      const stats = await getReplyStats(c.id, viewerId);
      return formatReply(c, stats);
    })
  );

  return { replies, total: count, page: Number(page), limit: Number(limit) };
};

const deleteReply = async (replyId, userId) => {
  const reply = await Reply.findByPk(replyId);
  if (!reply) return { notFound: true };
  if (reply.userId !== userId) return { forbidden: true };
  await reply.update({ isDeleted: true });
  
  if (reply.contentType === 'post' && !reply.parentId) {
    const replyCount = await Reply.count({ where: { contentType: 'post', contentId: reply.contentId, parentId: null, isDeleted: false } });
    await Post.update({ replyCount }, { where: { id: reply.contentId } });
  }

  return { deleted: true };
};

const toggleReplyLike = async (userId, replyId) => {
  const reply = await Reply.findByPk(replyId);
  if (!reply || reply.isDeleted) {
    const err = new Error('Reply not found');
    err.status = 404;
    throw err;
  }
  const existing = await ReplyLike.findOne({ where: { userId, replyId } });
  if (existing) {
    await existing.destroy();
  } else {
    await ReplyLike.create({ userId, replyId });
  }
  const likeCount = await ReplyLike.count({ where: { replyId } });
  return { liked: !existing, likeCount };
};

const getReplyCount = async (contentType, contentId) =>
  Reply.count({ where: { contentType, contentId, parentId: null, isDeleted: false } });

module.exports = {
  addReply,
  getReplies,
  getNestedReplies,
  deleteReply,
  toggleReplyLike,
  getReplyCount,
};
