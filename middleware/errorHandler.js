const logger = require('../utils/logger');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  logger.error(err);
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, 400, messages.join(', '));
  }

  const statusCode = err.statusCode || 500;
  // If it's a 500, we probably shouldn't leak the exact stack/message in production, but for now we'll just pass err.message
  error(res, statusCode, statusCode === 500 ? (err.message || 'Internal server error') : err.message);
};
