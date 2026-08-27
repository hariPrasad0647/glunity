const { createPost } = require('../../post/services/post.service');
const { createReel } = require('../../reel/services/reel.service');
const { success, error } = require('../../../utils/response');

const createContentController = async (req, res, next) => {
  try {
    const { caption, content, isPrivate } = req.body;

    if (req.contentType === 'reel') {
      const { videoUrl, thumbnailUrl } = req.reelUpload;
      const reel = await createReel(req.user.id, { caption, isPrivate }, videoUrl, thumbnailUrl);
      return success(res, 201, 'Reel created successfully', { type: 'reel', ...reel });
    }

    if (req.contentType === 'post') {
      if (!req.cdnUrls?.length && (!content || content.trim() === '')) {
        return error(res, 400, 'Post must contain text or media');
      }
      const post = await createPost(req.user.id, { content, isPrivate }, req.cdnUrls || []);
      return success(res, 201, 'Post created successfully', { type: 'post', ...post });
    }

    return error(res, 400, 'Invalid content type');
  } catch (err) {
    next(err);
  }
};

module.exports = { createContentController };
