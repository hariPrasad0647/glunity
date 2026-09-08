const { body } = require('express-validator');

const signupValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_.]{3,30}$/)
    .withMessage('Username must be 3-30 characters (letters, numbers, _ or .)'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty if provided')
    .isMobilePhone('any')
    .withMessage('A valid phone number is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
];

const googleLoginValidator = [
  body('idToken')
    .trim()
    .notEmpty()
    .withMessage('Google ID token is required'),
];

const appleLoginValidator = [
  body('identityToken')
    .trim()
    .notEmpty()
    .withMessage('Apple identity token is required'),
];

module.exports = {
  signupValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  loginValidator,
  googleLoginValidator,
  appleLoginValidator,
};
