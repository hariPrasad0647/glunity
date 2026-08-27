const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const { uuidParam } = require('../../../utils/paramValidators');
const { uploadReel } = require('../../../middleware/upload');
const { createReelValidator } = require('../validators/reel.validator');
const { replyTextValidator } = require('../../reply/validators/reply.validator');
const {
  createReelController,
  getPublicReelsController,
  getReelController,
  likeReelController,
  bookmarkReelController,
  repostReelController,
} = require('../controllers/reel.controller');
const {
  addReplyController,
  getRepliesController,
  addNestedReplyController,
  getNestedRepliesController,
  deleteReplyController,
  likeReplyController,
} = require('../../reply/controllers/reply.controller');

const setReel = (req, res, next) => { req.contentType = 'reel'; next(); };

// POST /api/reels
router.post('/', auth, uploadReel, createReelValidator, validate, createReelController);

// GET /api/reels/discover — reels from public accounts only (must precede /:id)
router.get('/discover', auth, getPublicReelsController);

// GET /api/reels/:id
router.get('/:id', auth, uuidParam('id'), validate, getReelController);

// POST /api/reels/:id/like
router.post('/:id/like', auth, uuidParam('id'), validate, likeReelController);

// POST /api/reels/:id/bookmark
router.post('/:id/bookmark', auth, uuidParam('id'), validate, bookmarkReelController);

// POST /api/reels/:id/repost
router.post('/:id/repost', auth, uuidParam('id'), validate, repostReelController);

// Replies
router.get('/:id/replies', auth, uuidParam('id'), validate, setReel, getRepliesController);
router.post(
  '/:id/replies',
  auth,
  setReel,
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
  setReel,
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
