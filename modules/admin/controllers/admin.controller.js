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
    // 1. Total Users
    const [[totalUsersData]] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [[newUsersLast30Data]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const totalUsers = totalUsersData.count;
    const totalUsersPrev = totalUsers - newUsersLast30Data.count;

    // 2. Active Users
    const [[activeUsersData]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE `updatedAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [[activeUsersPrevData]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE `updatedAt` > DATE_SUB(NOW(), INTERVAL 60 DAY) AND `updatedAt` <= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const activeUsers = activeUsersData.count;
    const activeUsersPrev = activeUsersPrevData.count;

    // 3. Total Posts
    const [[totalPostsData]] = await sequelize.query('SELECT COUNT(*) as count FROM posts');
    const [[newPostsLast30Data]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM posts WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const totalPosts = totalPostsData.count;
    const totalPostsPrev = totalPosts - newPostsLast30Data.count;

    // 4. Total Engagement (likes + views + reposts + replies)
    const [[likesAll]] = await sequelize.query('SELECT COUNT(*) as count FROM likes');
    const [[viewsAll]] = await sequelize.query('SELECT COUNT(*) as count FROM views');
    const [[repostsAll]] = await sequelize.query('SELECT COUNT(*) as count FROM reposts');
    const [[repliesAll]] = await sequelize.query('SELECT COUNT(*) as count FROM replies');
    const totalEngagement = likesAll.count + viewsAll.count + repostsAll.count + repliesAll.count;

    const [[likes30]] = await sequelize.query('SELECT COUNT(*) as count FROM likes WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const [[views30]] = await sequelize.query('SELECT COUNT(*) as count FROM views WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const [[reposts30]] = await sequelize.query('SELECT COUNT(*) as count FROM reposts WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const [[replies30]] = await sequelize.query('SELECT COUNT(*) as count FROM replies WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)');
    const engagementLast30 = likes30.count + views30.count + reposts30.count + replies30.count;
    const totalEngagementPrev = totalEngagement - engagementLast30;

    // 5. Chat Messages
    const [[chatMessagesData]] = await sequelize.query('SELECT COUNT(*) as count FROM messages');
    const [[newMessagesLast30Data]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM messages WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const chatMessages = chatMessagesData.count;
    const chatMessagesPrev = chatMessages - newMessagesLast30Data.count;

    // 6. Points Distributed
    const [[pointsData]] = await sequelize.query('SELECT SUM(points) as total FROM point_transactions WHERE points > 0');
    const [[pointsLast30Data]] = await sequelize.query(
      'SELECT SUM(points) as total FROM point_transactions WHERE points > 0 AND `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const pointsDistributed = pointsData.total || 0;
    const pointsDistributedPrev = pointsDistributed - (pointsLast30Data.total || 0);

    // 7. Reposts
    const reposts = repostsAll.count;
    const [[newRepostsLast30Data]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM reposts WHERE `createdAt` > DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const repostsPrev = reposts - newRepostsLast30Data.count;

    // 8. User Growth (7 Days)
    const [userGrowthData] = await sequelize.query(
      'SELECT DATE(`createdAt`) as date, COUNT(*) as count FROM users WHERE `createdAt` >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(`createdAt`) ORDER BY date ASC'
    );

    // 9. User Activity Distribution
    const [[inactiveUsersData]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE `updatedAt` <= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [[returningUsersData]] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE `updatedAt` > DATE_SUB(NOW(), INTERVAL 30 DAY) AND `createdAt` <= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const userActivity = {
      inactive: inactiveUsersData.count,
      new: newUsersLast30Data.count,
      returning: returningUsersData.count,
    };

    // 10. Top Users
    const [topUsers] = await sequelize.query(
      'SELECT u.id, u.username, u.`fullName` as name, u.`profileImage` as avatar, COALESCE(ts.`finalScore`, 0) as trustScore, COALESCE((SELECT SUM(points) FROM point_transactions pt WHERE pt.`userId` = u.id AND pt.points > 0), 0) as points, COALESCE((SELECT COUNT(*) FROM posts p WHERE p.`userId` = u.id), 0) as posts FROM users u LEFT JOIN trust_scores ts ON ts.`userId` = u.id ORDER BY points DESC LIMIT 5'
    );

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

exports.getAllUsers = async (req, res, next) => {
  try {
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 10;
    var offset = (page - 1) * limit;
    var search = req.query.search || '';

    var searchCondition = '';
    var replacements = [];
    if (search) {
      searchCondition = 'WHERE u.username LIKE ? OR u.`fullName` LIKE ? OR u.email LIKE ?';
      replacements = ['%' + search + '%', '%' + search + '%', '%' + search + '%'];
    }

    var countQuery = 'SELECT COUNT(*) as count FROM users u ' + searchCondition;
    const [[countResult]] = await sequelize.query(countQuery, { replacements: replacements });
    var totalUsers = countResult.count;

    var dataQuery = 'SELECT u.id, u.username, u.`fullName`, u.email, u.`profileImage` as avatar, u.`createdAt` as joined, COALESCE(ts.`finalScore`, 0) as trustScore, COALESCE((SELECT SUM(points) FROM point_transactions pt WHERE pt.`userId` = u.id AND pt.points > 0), 0) as points FROM users u LEFT JOIN trust_scores ts ON ts.`userId` = u.id ' + searchCondition + ' ORDER BY u.`createdAt` DESC LIMIT ? OFFSET ?';

    const [users] = await sequelize.query(dataQuery, {
      replacements: replacements.concat([limit, offset])
    });

    res.json({
      success: true,
      data: {
        users: users.map(function(user) {
          return Object.assign({}, user, { status: 'Active' });
        }),
        pagination: {
          total: totalUsers,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    var userId = req.params.id;

    const [[user]] = await sequelize.query('SELECT * FROM users WHERE id = ?', { replacements: [userId] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [[postsData]] = await sequelize.query('SELECT COUNT(*) as count FROM posts WHERE `userId` = ?', { replacements: [userId] });
    const [[repostsData]] = await sequelize.query('SELECT COUNT(*) as count FROM reposts WHERE `userId` = ?', { replacements: [userId] });
    const [[followersData]] = await sequelize.query('SELECT COUNT(*) as count FROM follows WHERE `followingId` = ? AND status = ?', { replacements: [userId, 'accepted'] });
    const [[followingData]] = await sequelize.query('SELECT COUNT(*) as count FROM follows WHERE `followerId` = ? AND status = ?', { replacements: [userId, 'accepted'] });
    const [[trustScoreData]] = await sequelize.query('SELECT `finalScore` FROM trust_scores WHERE `userId` = ?', { replacements: [userId] });
    const [[pointsData]] = await sequelize.query('SELECT SUM(points) as total FROM point_transactions WHERE `userId` = ? AND points > 0', { replacements: [userId] });

    res.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          bio: user.bio,
          profileImage: user.profileImage,
          bannerImage: user.bannerImage,
          joined: user.createdAt,
          profession: user.profession
        },
        stats: {
          posts: postsData.count,
          reposts: repostsData.count,
          followers: followersData.count,
          following: followingData.count,
          trustScore: trustScoreData ? trustScoreData.finalScore : 0,
          points: pointsData.total || 0,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    next(error);
  }
};
