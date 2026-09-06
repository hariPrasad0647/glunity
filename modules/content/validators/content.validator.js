const { body } = require('express-validator');

const createContentValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 })
    .withMessage('Caption must not exceed 2200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters'),


];

module.exports = { createContentValidator };
