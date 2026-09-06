const { getSummary, getHistory, getMonthlyHistory } = require('../services/points.service');
const { success, error } = require('../../../utils/response');

/**
 * GET /api/points/summary
 * Returns total lifetime points and current-month points.
 */
const getSummaryController = async (req, res, next) => {
  try {
    const data = await getSummary(req.user.id);
    return success(res, 200, 'Points summary fetched successfully', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/points/history?page=1&limit=20
 * Returns paginated point transaction history.
 */
const getHistoryController = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const data = await getHistory(req.user.id, { page, limit });
    return success(res, 200, 'Points history fetched successfully', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/points/monthly
 * Returns historical monthly point totals.
 */
const getMonthlyController = async (req, res, next) => {
  try {
    const monthly = await getMonthlyHistory(req.user.id);
    return success(res, 200, 'Monthly points fetched successfully', { monthly });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummaryController, getHistoryController, getMonthlyController };
