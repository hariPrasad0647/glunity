const { Op } = require('sequelize');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');
const Otp = require('../models/otp.model');
const AuthIdentity = require('../models/auth-identity.model');
const Referral = require('../../referral/models/referral.model');
const bcrypt = require('bcryptjs');
const { generateOtp, hashOtp, compareOtp } = require('../../../utils/otp');
const { sendOtpEmail } = require('../../../utils/email');
const { signAccessToken, signRefreshToken } = require('../../../config/jwt');

const OTP_PURPOSE_FORGOT_PASSWORD = 'forgot-password';
const OTP_TTL_SECONDS = Number(process.env.OTP_EXPIRES_IN || 300);
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getActiveCooldown = async (email, purpose) => {
  const lastOtp = await Otp.findOne({
    where: { email, purpose },
    order: [['createdAt', 'DESC']],
  });
  if (!lastOtp) return 0;
  const elapsed = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
  return elapsed < RESEND_COOLDOWN_SECONDS ? Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) : 0;
};

const generateUniqueReferralCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const existing = await User.findOne({ where: { referralCode: code } });
    if (!existing) isUnique = true;
  }
  return code;
};

const issueOtp = async (email, purpose) => {
  const code = generateOtp();
  const codeHash = await hashOtp(code);

  await Otp.update(
    { consumedAt: new Date() },
    { where: { email, purpose, consumedAt: null } }
  );

  await Otp.create({
    email,
    codeHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
  });

  await sendOtpEmail(email, code, purpose);
};

const buildAuthResponse = (user) => {
  const payload = { id: user.id, email: user.email, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
    },
    accessToken,
    refreshToken,
  };
};

const signup = async ({ fullName, username, email, phone, password, referralCode }) => {
  if (!fullName || !username || !email || !password) {
    const missing = ['fullName', 'username', 'email', 'password'].filter(
      (f) => !{ fullName, username, email, password }[f]
    );
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }

  // Block if an account already holds this email or username
  const existingUser = await User.findOne({
    where: { [Op.or]: [{ email }, { username }] },
  });
  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw new ApiError(409, `An account with this ${field} already exists`);
  }

  // Validate referral code if provided
  if (referralCode) {
    const referrer = await User.findOne({ where: { referralCode } });
    if (!referrer) {
      throw new ApiError(400, 'Invalid referral code');
    }
  }

  const newReferralCode = await generateUniqueReferralCode();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await sequelize.transaction(async (t) => {
    const newUser = await User.create(
      { fullName, username, email, phone, password: hashedPassword, isVerified: true, referralCode: newReferralCode },
      { transaction: t }
    );
    
    // Process referral
    if (referralCode) {
      const referrer = await User.findOne({ where: { referralCode }, transaction: t });
      if (referrer && referrer.id !== newUser.id) {
        await Referral.create({
          referrerId: referrer.id,
          referredUserId: newUser.id,
          referralCode: referralCode,
          status: 'PENDING'
        }, { transaction: t });
      }
    }
    
    return newUser;
  });

  return buildAuthResponse(user);
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  if (!user.password) {
    throw new ApiError(400, 'This account uses social login. Please login with Google/Apple or use Forgot Password to set a password.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return buildAuthResponse(user);
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  const cooldown = await getActiveCooldown(email, OTP_PURPOSE_FORGOT_PASSWORD);
  if (cooldown > 0) {
    throw new ApiError(429, `Please wait ${cooldown}s before requesting another code`);
  }

  await issueOtp(email, OTP_PURPOSE_FORGOT_PASSWORD);
  return { email };
};

const resetPassword = async (email, code, newPassword) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  const otp = await Otp.findOne({
    where: { email, purpose: OTP_PURPOSE_FORGOT_PASSWORD, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!otp) throw new ApiError(400, 'No active password reset code found, please request a new one');
  if (otp.expiresAt < new Date()) throw new ApiError(400, 'Password reset code has expired');
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect attempts, please request a new code');
  }

  const isMatch = await compareOtp(code, otp.codeHash);
  if (!isMatch) {
    await otp.increment('attempts');
    throw new ApiError(400, 'Invalid reset code');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await sequelize.transaction(async (t) => {
    await otp.update({ consumedAt: new Date() }, { transaction: t });
    await user.update({ password: hashedPassword }, { transaction: t });
  });

  return buildAuthResponse(user);
};

const socialLogin = async ({ provider, providerUserId, email, fullName, referralCode }) => {
  let identity = await AuthIdentity.findOne({
    where: { provider, providerUserId },
    include: [{ model: User, as: 'user' }],
  });

  if (identity) {
    return buildAuthResponse(identity.user);
  }

  if (email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(
        409,
        'An account with this email already exists. Please login using your Email and link this social account in your settings.'
      );
    }
  }

  // Validate referral code if provided
  let validReferrer = null;
  if (referralCode) {
    validReferrer = await User.findOne({ where: { referralCode } });
    if (!validReferrer) {
      throw new ApiError(400, 'Invalid referral code');
    }
  }

  const newReferralCode = await generateUniqueReferralCode();

  // Create new user & identity atomically
  const user = await sequelize.transaction(async (t) => {
    // Generate a unique username based on full name or random string
    const baseUsername = fullName
      ? fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
      : provider.toLowerCase();
    
    // Quick uniqueness check (ideally this should have a robust loop, but fine for now)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${baseUsername}${randomSuffix}`.substring(0, 30);

    const newUser = await User.create(
      {
        fullName: fullName || 'New User',
        username,
        email: email || `${providerUserId}@${provider.toLowerCase()}.local`,
        phone: null, // Phone is now nullable
        isVerified: true, // Social accounts are pre-verified
        referralCode: newReferralCode,
      },
      { transaction: t }
    );

    await AuthIdentity.create(
      {
        userId: newUser.id,
        provider,
        providerUserId,
        email,
      },
      { transaction: t }
    );

    // Process referral
    if (validReferrer && validReferrer.id !== newUser.id) {
      await Referral.create({
        referrerId: validReferrer.id,
        referredUserId: newUser.id,
        referralCode: referralCode,
        status: 'PENDING'
      }, { transaction: t });
    }

    return newUser;
  });

  return buildAuthResponse(user);
};

module.exports = { ApiError, signup, login, forgotPassword, resetPassword, socialLogin, generateUniqueReferralCode };
