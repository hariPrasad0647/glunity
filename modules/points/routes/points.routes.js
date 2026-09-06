const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const {
  getSummaryController,
  getHistoryController,
  getMonthlyController,
} = require('../controllers/points.controller');

// All points endpoints require authentication
// The frontend CANNOT send point values — the backend determines everything

// GET /api/points/summary
router.get('/summary', auth, getSummaryController);

// GET /api/points/history?page=1&limit=20
router.get('/history', auth, getHistoryController);

// GET /api/points/monthly
router.get('/monthly', auth, getMonthlyController);

module.exports = router;
