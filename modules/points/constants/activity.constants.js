// ── Airdrop Points — Activity Types & Point Values ──────────────────────────
// Centralized constants. DO NOT scatter point values throughout the codebase.
// To add a new activity, add it here and the PointsService picks it up automatically.

const ACTIVITY_TYPES = Object.freeze({
  PROFILE_SETUP:  'PROFILE_SETUP',
  QUALITY_POST:   'QUALITY_POST',
  RECEIVED_LIKE:  'RECEIVED_LIKE',
  COMMENT:        'COMMENT',
  REPOST:         'REPOST',
  DAILY_ACTIVITY: 'DAILY_ACTIVITY',
  CHAT_MESSAGE:   'CHAT_MESSAGE',
});

const POINT_VALUES = Object.freeze({
  [ACTIVITY_TYPES.PROFILE_SETUP]:  1000,
  [ACTIVITY_TYPES.QUALITY_POST]:   100,
  [ACTIVITY_TYPES.RECEIVED_LIKE]:  2,
  [ACTIVITY_TYPES.COMMENT]:        10,
  [ACTIVITY_TYPES.REPOST]:         5,
  [ACTIVITY_TYPES.DAILY_ACTIVITY]: 50,
  [ACTIVITY_TYPES.CHAT_MESSAGE]:   2,
});

const ACTIVITY_DESCRIPTIONS = Object.freeze({
  [ACTIVITY_TYPES.PROFILE_SETUP]:  'Profile Setup',
  [ACTIVITY_TYPES.QUALITY_POST]:   'Quality Post',
  [ACTIVITY_TYPES.RECEIVED_LIKE]:  'Received Like',
  [ACTIVITY_TYPES.COMMENT]:        'Comment',
  [ACTIVITY_TYPES.REPOST]:         'Repost',
  [ACTIVITY_TYPES.DAILY_ACTIVITY]: 'Daily Activity',
  [ACTIVITY_TYPES.CHAT_MESSAGE]:   'Chat Message',
});

module.exports = { ACTIVITY_TYPES, POINT_VALUES, ACTIVITY_DESCRIPTIONS };
