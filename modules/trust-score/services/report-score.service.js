/**
 * Report Score Service (10% of total)
 * 
 * Conceptually: No verified negative reports -> 100.
 * Serious violations reduce this score.
 * 
 * IMPORTANT MVP LIMITATION: Since no verified moderation/reports module exists 
 * in the codebase yet, this returns the default maximum score (100) until the 
 * module is implemented.
 */
const { MVP_CONFIG } = require('../constants/trust-score.constants');

const calculateReportScore = async (userId) => {
  let score = 100;

  // TODO: Integrate with moderation/report module when available
  // 1. Fetch verified reports against this user
  // 2. Reduce score based on severity (e.g., MVP_CONFIG.REPORTS.DEDUCTION_PER_VERIFIED_REPORT)
  
  // Example future logic:
  // const verifiedReportsCount = await ReportModel.count({ where: { reportedUserId: userId, status: 'VERIFIED' } });
  // score -= (verifiedReportsCount * MVP_CONFIG.REPORTS.DEDUCTION_PER_VERIFIED_REPORT);

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
};

module.exports = {
  calculateReportScore,
};
