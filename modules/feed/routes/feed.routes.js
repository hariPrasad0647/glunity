const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getFeedController, getHomeFeedController, getFollowingFeedController } = require('../controllers/feed.controller');

// GET /api/feed/home — global chronological feed of all posts/reels
router.get('/home', auth, getHomeFeedController);

router.get('/', auth, getFeedController);

// GET /api/feed/following - feed restricted to users you follow
router.get('/following', auth, getFollowingFeedController);

module.exports = router;
