const fs = require('fs');
const file = 'd:/glunity/glunity/modules/admin/controllers/admin.controller.js';
let content = fs.readFileSync(file, 'utf8');

const newMethods = `

// ================= ANALYTICS MODULES ================= //

exports.getUserGrowthAnalytics = async (req, res, next) => {
  try {
    const [[dauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)');
    const [[wauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [[mauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)');

    // Previous periods for percentage calculation
    const [[prevDauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 2 DAY) AND updatedAt < DATE_SUB(NOW(), INTERVAL 1 DAY)');
    const [[prevWauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND updatedAt < DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [[prevMauData]] = await sequelize.query('SELECT COUNT(*) as count FROM users WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND updatedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)');

    const calcPercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    res.json({
      success: true,
      data: {
        dau: {
          value: dauData.count,
          percentageChange: calcPercentage(dauData.count, prevDauData.count)
        },
        wau: {
          value: wauData.count,
          percentageChange: calcPercentage(wauData.count, prevWauData.count)
        },
        mau: {
          value: mauData.count,
          percentageChange: calcPercentage(mauData.count, prevMauData.count)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    next(error);
  }
};

exports.getEngagementAnalytics = async (req, res, next) => {
  try {
    const [engagementData] = await sequelize.query(
      "SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(likeCount) as likes, SUM(replyCount) as comments FROM posts WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC"
    );

    res.json({
      success: true,
      data: {
        monthlyEngagement: engagementData
      }
    });
  } catch (error) {
    console.error('Error fetching engagement analytics:', error);
    next(error);
  }
};

exports.getRetentionAnalytics = async (req, res, next) => {
  try {
    // Simplified cohort retention based on registration month (createdAt) and last active month (updatedAt)
    const [retentionData] = await sequelize.query(
      "SELECT DATE_FORMAT(createdAt, '%Y-%m') as cohortMonth, DATE_FORMAT(updatedAt, '%Y-%m') as activeMonth, COUNT(*) as userCount FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY cohortMonth, activeMonth ORDER BY cohortMonth ASC, activeMonth ASC"
    );

    // Format into a heatmap structure
    const cohorts = {};
    retentionData.forEach(row => {
      if (!cohorts[row.cohortMonth]) {
        cohorts[row.cohortMonth] = { total: 0, retention: {} };
      }
      cohorts[row.cohortMonth].retention[row.activeMonth] = row.userCount;
      cohorts[row.cohortMonth].total += row.userCount; 
    });

    res.json({
      success: true,
      data: {
        cohorts
      }
    });
  } catch (error) {
    console.error('Error fetching retention analytics:', error);
    next(error);
  }
};

`;

content = content + newMethods;
fs.writeFileSync(file, content);
console.log('Added analytics methods');
