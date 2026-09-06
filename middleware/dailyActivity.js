const { awardDailyActivity } = require('../modules/points/services/points.service');

/**
 * Daily Activity Middleware
 *
 * Awards +50 points once per UTC calendar day per authenticated user.
 * Must be mounted AFTER auth middleware so req.user is populated.
 *
 * Fires non-blocking — does not await and never delays the response.
 * Failures are caught internally and logged by the points service.
 */
const dailyActivityMiddleware = (req, res, next) => {
  if (req.user && req.user.id) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" UTC
    // Non-blocking — intentionally no await
    awardDailyActivity(req.user.id, today).catch(() => {});
  }
  next();
};

module.exports = dailyActivityMiddleware;
