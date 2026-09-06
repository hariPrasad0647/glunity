const { body } = require('express-validator');

const createReelValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 })
    .withMessage('Caption must not exceed 2200 characters'),


];

module.exports = { createReelValidator };
