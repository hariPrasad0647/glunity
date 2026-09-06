const { Op } = require('sequelize');
const Referral = require('../models/referral.model');
const User = require('../../user/models/user.model');
const response = require('../../../utils/response');

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return response.error(res, 404, 'User not found');
    }

    const referralCode = user.referralCode;
    const clientUrl = process.env.CLIENT_URL || 'https://glunity.org';
    const referralLink = `${clientUrl}/signup?ref=${referralCode}`;

    const totalReferrals = await Referral.count({ where: { referrerId: userId } });
    const successfulReferrals = await Referral.count({ where: { referrerId: userId, status: 'COMPLETED' } });
    const pendingReferrals = await Referral.count({ where: { referrerId: userId, status: 'PENDING' } });
    const pointsEarned = await Referral.sum('pointsAwarded', { where: { referrerId: userId } }) || 0;

    return response.success(res, 200, 'Referral stats fetched successfully', {
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: totalReferrals,
      successful_referrals: successfulReferrals,
      pending_referrals: pendingReferrals,
      points_earned: pointsEarned,
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Referral.findAndCountAll({
      where: { referrerId: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const formattedReferrals = rows.map(r => ({
      id: r.id,
      status: r.status,
      points_awarded: r.pointsAwarded,
      created_at: r.createdAt,
      completed_at: r.completedAt,
    }));

    return response.success(res, 200, 'Referral history fetched successfully', {
      referrals: formattedReferrals,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  getHistory,
};
