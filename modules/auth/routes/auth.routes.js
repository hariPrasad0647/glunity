const router = require('express').Router();
const validate = require('../../../middleware/validate');
const controller = require('../controllers/auth.controller');
const { authLimiter } = require('../../../middleware/rateLimiter');
const {
  signupValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  loginValidator,
  googleLoginValidator,
  appleLoginValidator,
} = require('../validators/auth.validator');

// router.post('/signup', authLimiter, signupValidator, validate, controller.signup);
router.post('/signup', signupValidator, validate, controller.signup);
// router.post('/login', authLimiter, loginValidator, validate, controller.login);
router.post('/login', loginValidator, validate, controller.login);
// router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, controller.forgotPassword);
router.post('/forgot-password', forgotPasswordValidator, validate, controller.forgotPassword);
// router.post('/reset-password', authLimiter, resetPasswordValidator, validate, controller.resetPassword);
router.post('/reset-password', resetPasswordValidator, validate, controller.resetPassword);
// router.post('/google', authLimiter, googleLoginValidator, validate, controller.googleLogin);
router.post('/google', googleLoginValidator, validate, controller.googleLogin);
// router.post('/apple', authLimiter, appleLoginValidator, validate, controller.appleLogin);
router.post('/apple', appleLoginValidator, validate, controller.appleLogin);

module.exports = router;
