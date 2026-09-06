const { body } = require('express-validator');

const createPostValidator = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters'),


];

module.exports = { createPostValidator };
