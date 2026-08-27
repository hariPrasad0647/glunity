const { body } = require('express-validator');

const replyTextValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Reply text is required')
    .isLength({ max: 1000 })
    .withMessage('Reply must not exceed 1000 characters'),
];

module.exports = { replyTextValidator };
