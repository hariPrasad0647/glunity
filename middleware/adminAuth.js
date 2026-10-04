const { verifyAccessToken } = require('../config/jwt');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, 401, 'Authentication required');
  }

  try {
    const decoded = verifyAccessToken(header.split(' ')[1]);
    if (decoded.role !== 'admin') {
      return error(res, 403, 'Access denied. Admin privileges required.');
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return error(res, 401, 'Invalid or expired token');
  }
};
