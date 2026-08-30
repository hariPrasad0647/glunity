const router = require('express').Router();
const validate = require('../../../middleware/validate');
const controller = require('../controllers/auth.controller');
const { authLimiter } = require('../../../middleware/rateLimiter');
const {
  signupValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  verifyLoginValidator,
  googleLoginValidator,
  appleLoginValidator,
} = require('../validators/auth.validator');

// router.post('/signup', authLimiter, signupValidator, validate, controller.signup);
router.post('/signup', signupValidator, validate, controller.signup);
// router.post('/resend-otp', authLimiter, resendOtpValidator, validate, controller.resendOtp);
router.post('/resend-otp', resendOtpValidator, validate, controller.resendOtp);
// router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, controller.verifyOtp);
router.post('/verify-otp', verifyOtpValidator, validate, controller.verifyOtp);
// router.post('/login', authLimiter, loginValidator, validate, controller.login);
router.post('/login', loginValidator, validate, controller.login);
// router.post('/login/verify', authLimiter, verifyLoginValidator, validate, controller.verifyLogin);
router.post('/login/verify', verifyLoginValidator, validate, controller.verifyLogin);
// router.post('/google', authLimiter, googleLoginValidator, validate, controller.googleLogin);
router.post('/google', googleLoginValidator, validate, controller.googleLogin);
// router.post('/apple', authLimiter, appleLoginValidator, validate, controller.appleLogin);
router.post('/apple', appleLoginValidator, validate, controller.appleLogin);

module.exports = router;
