const authService = require('../services/auth.service');
const googleService = require('../services/google.service');
const appleService = require('../services/apple.service');
const response = require('../../../utils/response');

const signup = async (req, res, next) => {
  try {
    const { fullName, username, email, phone } = req.body;
    const result = await authService.signup({ fullName, username, email, phone });
    return response.success(res, 201, 'Verification code sent to your email', result);
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp(email);
    return response.success(res, 200, 'Verification code resent', result);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtp(email, code);
    return response.success(res, 200, 'Account verified successfully', result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestLogin(email);
    return response.success(res, 200, 'Login code sent to your email', result);
  } catch (err) {
    next(err);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyLogin(email, code);
    return response.success(res, 200, 'Logged in successfully', result);
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const googleProfile = await googleService.verifyGoogleToken(idToken);
    const result = await authService.socialLogin({
      provider: 'GOOGLE',
      providerUserId: googleProfile.providerUserId,
      email: googleProfile.email,
      fullName: googleProfile.fullName,
    });
    return response.success(res, 200, 'Logged in with Google successfully', result);
  } catch (err) {
    next(err);
  }
};

const appleLogin = async (req, res, next) => {
  try {
    const { identityToken, fullName } = req.body;
    const appleProfile = await appleService.verifyAppleToken(identityToken);
    const result = await authService.socialLogin({
      provider: 'APPLE',
      providerUserId: appleProfile.providerUserId,
      email: appleProfile.email,
      fullName: fullName || 'Apple User', // fullName might only be sent on first sign-in
    });
    return response.success(res, 200, 'Logged in with Apple successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, resendOtp, verifyOtp, login, verifyLogin, googleLogin, appleLogin };
