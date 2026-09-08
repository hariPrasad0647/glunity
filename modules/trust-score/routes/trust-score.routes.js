const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getMyTrustScoreController, getMyTrustScoreHistoryController } = require('../controllers/trust-score.controller');

router.get('/me', auth, getMyTrustScoreController);
router.get('/history', auth, getMyTrustScoreHistoryController);

module.exports = router;
