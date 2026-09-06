const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const protect = require('../../../middleware/auth');

router.get('/me', protect, referralController.getMe);
router.get('/history', protect, referralController.getHistory);

module.exports = router;
