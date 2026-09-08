const TRUST_SCORE_WEIGHTS = {
  ON_CHAIN: 0.20,
  SMART_FOLLOWERS: 0.20,
  ENGAGEMENT: 0.30,
  LONGEVITY: 0.20,
  REPORTS: 0.10,
};

const TRUST_SCORE_LIMITS = {
  MIN: 0,
  MAX: 100,
};

const MONETIZATION_THRESHOLD = 65;

const TIERS = [
  { min: 0, max: 29, name: 'UNVERIFIED' },
  { min: 30, max: 49, name: 'EMERGING' },
  { min: 50, max: 64, name: 'RESONANT VOICE' },
  { min: 65, max: 74, name: 'GLUNITY TRUSTED' },
  { min: 75, max: 89, name: 'GLUNITY SENTINEL' },
  { min: 90, max: 100, name: 'GLUNITY ELITE' },
];

const CALCULATION_REASONS = {
  WEEKLY: 'WEEKLY',
  CRITICAL_REPORT: 'CRITICAL_REPORT',
  MANUAL_RECALCULATION: 'MANUAL_RECALCULATION',
};

// MVP Implementation Assumptions
const MVP_CONFIG = {
  SMART_FOLLOWER_MIN_TRUST_SCORE: 65,
  SMART_FOLLOWER_ACTIVITY_WINDOW_DAYS: 30,
  ENGAGEMENT_LOOKBACK_DAYS: 30,
  
  // Engagement Scoring Assumptions
  ENGAGEMENT_WEIGHTS: {
    POSTS: 0.40,
    COMMENTS: 0.30,
    LIKES: 0.20,
    REPOSTS: 0.10,
  },
  ENGAGEMENT_DAILY_CAPS: {
    POSTS: 10,
    COMMENTS: 20,
    LIKES: 50,
    REPOSTS: 10,
  },

  // Longevity Scoring Assumptions
  LONGEVITY: {
    MAX_DAYS: 365, // Account age to reach max score
    INACTIVITY_GRACE_PERIOD_DAYS: 30, // Days before decay starts
    INACTIVITY_DECAY_RATE_PER_DAY: 0.5, // Points lost per day of inactivity after grace period
    MAX_INACTIVITY_DECAY: 50, // Maximum points lost due to inactivity
  },

  // Reports Scoring Assumptions
  REPORTS: {
    DEDUCTION_PER_VERIFIED_REPORT: 20, // Points deducted per verified report
  },
};

module.exports = {
  TRUST_SCORE_WEIGHTS,
  TRUST_SCORE_LIMITS,
  MONETIZATION_THRESHOLD,
  TIERS,
  CALCULATION_REASONS,
  MVP_CONFIG,
};
