const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getFeedController, getHomeFeedController } = require('../controllers/feed.controller');

// GET /api/feed/home — global chronological feed of all posts/reels
router.get('/home', auth, getHomeFeedController);

router.get('/', auth, getFeedController);

module.exports = router;
