const { createPost, getPostById, formatPost, deletePost } = require('../services/post.service');
const {
  toggleLike,
  toggleBookmark,
  repostContent,
  getInteractionStats,
} = require('../services/interaction.service');
const { success, error } = require('../../../utils/response');

const createPostController = async (req, res, next) => {
  try {
    const { content, isPrivate } = req.body;
    if ((!req.cdnUrls || req.cdnUrls.length === 0) && (!content || content.trim() === '')) {
      return error(res, 400, 'Post must contain text or media');
    }
    const post = await createPost(req.user.id, { content, isPrivate }, req.cdnUrls || []);
    return success(res, 201, 'Post created successfully', post);
  } catch (err) {
    next(err);
  }
};

const getPostController = async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return error(res, 404, 'Post not found');
    if (post.isPrivate && post.userId !== req.user.id) {
      return error(res, 403, 'This post is private');
    }
    const stats = await getInteractionStats('post', req.params.id, req.user.id);
    return success(res, 200, 'Post fetched successfully', formatPost(post, stats));
  } catch (err) {
    next(err);
  }
};

const deletePostController = async (req, res, next) => {
  try {
    await deletePost(req.user.id, req.params.id);
    return success(res, 200, 'Post deleted successfully');
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const likePostController = async (req, res, next) => {
  try {
    const result = await toggleLike(req.user.id, 'post', req.params.id);
    return success(res, 200, result.liked ? 'Post liked' : 'Post unliked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const bookmarkPostController = async (req, res, next) => {
  try {
    const result = await toggleBookmark(req.user.id, 'post', req.params.id);
    return success(res, 200, result.bookmarked ? 'Post bookmarked' : 'Post unbookmarked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const repostPostController = async (req, res, next) => {
  try {
    const result = await repostContent(req.user.id, 'post', req.params.id);
    return success(res, 200, 'Post reposted to your followers', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  createPostController,
  getPostController,
  deletePostController,
  likePostController,
  bookmarkPostController,
  repostPostController,
};
