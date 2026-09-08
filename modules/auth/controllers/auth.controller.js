const authService = require('../services/auth.service');
const googleService = require('../services/google.service');
const appleService = require('../services/apple.service');
const response = require('../../../utils/response');

const signup = async (req, res, next) => {
  try {
    const { fullName, username, email, phone, password, referralCode } = req.body;
    const result = await authService.signup({ fullName, username, email, phone, password, referralCode });
    return response.success(res, 201, 'Account created successfully', result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return response.success(res, 200, 'Logged in successfully', result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return response.success(res, 200, 'Password reset code sent to your email', result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    return response.success(res, 200, 'Password reset successfully', result);
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken, referralCode } = req.body;
    const googleProfile = await googleService.verifyGoogleToken(idToken);
    const result = await authService.socialLogin({
      provider: 'GOOGLE',
      providerUserId: googleProfile.providerUserId,
      email: googleProfile.email,
      fullName: googleProfile.fullName,
      referralCode,
    });
    return response.success(res, 200, 'Logged in with Google successfully', result);
  } catch (err) {
    next(err);
  }
};

const appleLogin = async (req, res, next) => {
  try {
    const { identityToken, fullName, referralCode } = req.body;
    const appleProfile = await appleService.verifyAppleToken(identityToken);
    const result = await authService.socialLogin({
      provider: 'APPLE',
      providerUserId: appleProfile.providerUserId,
      email: appleProfile.email,
      fullName: fullName || 'Apple User', // fullName might only be sent on first sign-in
      referralCode,
    });
    return response.success(res, 200, 'Logged in with Apple successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, forgotPassword, resetPassword, googleLogin, appleLogin };
