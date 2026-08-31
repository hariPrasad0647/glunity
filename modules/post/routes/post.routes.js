const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam } = require('../../../utils/paramValidators');
const { uploadPostImages } = require('../../../middleware/upload');
const { createPostValidator } = require('../validators/post.validator');
const { replyTextValidator } = require('../../reply/validators/reply.validator');
const {
  createPostController,
  getPostController,
  deletePostController,
  likePostController,
  bookmarkPostController,
  repostPostController,
} = require('../controllers/post.controller');
const {
  addReplyController,
  getRepliesController,
  addNestedReplyController,
  getNestedRepliesController,
  deleteReplyController,
  likeReplyController,
} = require('../../reply/controllers/reply.controller');

const setPost = (req, res, next) => { req.contentType = 'post'; next(); };

// POST /api/posts
router.post('/', auth, uploadPostImages, createPostValidator, validate, createPostController);

// GET /api/posts/:id
router.get('/:id', auth, uuidParam('id'), validate, getPostController);

// DELETE /api/posts/:id
router.delete('/:id', auth, uuidParam('id'), validate, deletePostController);

// POST /api/posts/:id/like
router.post('/:id/like', auth, uuidParam('id'), validate, likePostController);

// POST /api/posts/:id/bookmark
router.post('/:id/bookmark', auth, uuidParam('id'), validate, bookmarkPostController);

// POST /api/posts/:id/repost
router.post('/:id/repost', auth, uuidParam('id'), validate, repostPostController);

// Replies
router.get('/:id/replies', auth, uuidParam('id'), validate, setPost, getRepliesController);
router.post(
  '/:id/replies',
  auth,
  setPost,
  uuidParam('id'),
  replyTextValidator,
  validate,
  addReplyController
);
router.get(
  '/:id/replies/:replyId/replies',
  auth,
  uuidParam('id'),
  uuidParam('replyId'),
  validate,
  getNestedRepliesController
);
router.post(
  '/:id/replies/:replyId/replies',
  auth,
  setPost,
  uuidParam('id'),
  uuidParam('replyId'),
  replyTextValidator,
  validate,
  addNestedReplyController
);
router.delete(
  '/:id/replies/:replyId',
  auth,
  uuidParam('id'),
  uuidParam('replyId'),
  validate,
  deleteReplyController
);
router.post(
  '/:id/replies/:replyId/like',
  auth,
  uuidParam('id'),
  uuidParam('replyId'),
  validate,
  likeReplyController
);

module.exports = router;
