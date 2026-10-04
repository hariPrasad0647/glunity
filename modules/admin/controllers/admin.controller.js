const sequelize = require('../../../config/db');
const Admin = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const { signAccessToken } = require('../../../config/jwt');

exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ success: true, message: 'Admin registered successfully', data: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    next(error);
  }
};

exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signAccessToken({ id: admin.id, role: 'admin' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const calcPercentage = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Current period (last 30 days vs 30-60 days ago) for deltas where applicable.
    // For cumulative metrics (like total users), the current is all-time, 
    // previous is all-time minus the last 30 days.

    // 1. Total Users
    const [[totalUsersData]] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [[newUsersLast30Data]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const totalUsers = totalUsersData.count;
    const totalUsersPrev = totalUsers - newUsersLast30Data.count;

    // 2. Active Users (updated within 30 days vs updated 30-60 days ago)
    const [[activeUsersData]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 30 DAY)`);
    const [[activeUsersPrevData]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 60 DAY) AND updatedAt <= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
    const activeUsers = activeUsersData.count;
    const activeUsersPrev = activeUsersPrevData.count;

    // 3. Total Posts
    const [[totalPostsData]] = await sequelize.query('SELECT COUNT(*) as count FROM posts');
    const [[newPostsLast30Data]] = await sequelize.query('SELECT COUNT(*) as count FROM posts WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const totalPosts = totalPostsData.count;
    const totalPostsPrev = totalPosts - newPostsLast30Data.count;

    // 4. Total Engagement (likes + views + reposts + replies)
    const getEngagement = async (intervalStart, intervalEnd) => {
      let queryExt = intervalEnd ? `WHERE createdAt > DATE_SUB(NOW(), INTERVAL ${intervalStart} DAY) AND createdAt <= DATE_SUB(NOW(), INTERVAL ${intervalEnd} DAY)` : (intervalStart ? `WHERE createdAt > DATE_SUB(NOW(), INTERVAL ${intervalStart} DAY)` : '');
      const [[likes]] = await sequelize.query(`SELECT COUNT(*) as count FROM likes ${queryExt}`);
      const [[views]] = await sequelize.query(`SELECT COUNT(*) as count FROM views ${queryExt}`);
      const [[reposts]] = await sequelize.query(`SELECT COUNT(*) as count FROM reposts ${queryExt}`);
      const [[replies]] = await sequelize.query(`SELECT COUNT(*) as count FROM replies ${queryExt}`);
      return likes.count + views.count + reposts.count + replies.count;
    };
    
    const totalEngagement = await getEngagement();
    const engagementLast30 = await getEngagement(30);
    const totalEngagementPrev = totalEngagement - engagementLast30;

    // 5. Chat Messages
    const [[chatMessagesData]] = await sequelize.query('SELECT COUNT(*) as count FROM messages');
    const [[newMessagesLast30Data]] = await sequelize.query('SELECT COUNT(*) as count FROM messages WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const chatMessages = chatMessagesData.count;
    const chatMessagesPrev = chatMessages - newMessagesLast30Data.count;

    // 6. Points Distributed
    const [[pointsData]] = await sequelize.query(`SELECT SUM(points) as total FROM point_transactions WHERE points > 0`);
    const [[pointsLast30Data]] = await sequelize.query(`SELECT SUM(points) as total FROM point_transactions WHERE points > 0 AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)`);
    const pointsDistributed = pointsData.total || 0;
    const pointsDistributedPrev = pointsDistributed - (pointsLast30Data.total || 0);

    // 7. Reposts
    const [[repostsData]] = await sequelize.query('SELECT COUNT(*) as count FROM reposts');
    const [[newRepostsLast30Data]] = await sequelize.query('SELECT COUNT(*) as count FROM reposts WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const reposts = repostsData.count;
    const repostsPrev = reposts - newRepostsLast30Data.count;

    // 8. User Growth (7 Days)
    const [userGrowthData] = await sequelize.query(`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM users 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `);

    // 9. User Activity Distribution
    const [[inactiveUsersData]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE updatedAt <= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
    const [[returningUsersData]] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) AND createdAt <= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
    
    const userActivity = {
      inactive: inactiveUsersData.count,
      new: newUsersLast30Data.count,
      returning: returningUsersData.count,
    };

    // 10. Top Users
    const [topUsers] = await sequelize.query(`
      SELECT 
        u.id, 
        u.username, 
        u.fullName as name, 
        u.profileImage as avatar, 
        COALESCE(ts.finalScore, 0) as trustScore, 
        COALESCE((SELECT SUM(points) FROM point_transactions pt WHERE pt.userId = u.id AND pt.points > 0), 0) as points, 
        COALESCE((SELECT COUNT(*) FROM posts p WHERE p.userId = u.id), 0) as posts 
      FROM users u 
      LEFT JOIN trust_scores ts ON ts.userId = u.id 
      ORDER BY points DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: {
            value: totalUsers,
            percentageChange: calcPercentage(totalUsers, totalUsersPrev)
          },
          activeUsers: {
            value: activeUsers,
            percentageChange: calcPercentage(activeUsers, activeUsersPrev)
          },
          totalPosts: {
            value: totalPosts,
            percentageChange: calcPercentage(totalPosts, totalPostsPrev)
          },
          totalEngagement: {
            value: totalEngagement,
            percentageChange: calcPercentage(totalEngagement, totalEngagementPrev)
          },
          chatMessages: {
            value: chatMessages,
            percentageChange: calcPercentage(chatMessages, chatMessagesPrev)
          },
          pointsDistributed: {
            value: pointsDistributed,
            percentageChange: calcPercentage(pointsDistributed, pointsDistributedPrev)
          },
          reposts: {
            value: reposts,
            percentageChange: calcPercentage(reposts, repostsPrev)
          }
        },
        userGrowth: userGrowthData,
        userActivity,
        topUsers
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};
