/**
 * Migration: Backfill postId for existing notifications.
 *
 * COMMENT/REPLY notifications: entityId → Reply.id → Reply.contentId = postId
 * LIKE/REPOST notifications:   entityId is the post/reel ID directly
 *
 * Usage: node migrations/004-backfill-notification-postId.js
 * Or: it runs as part of server startup if wired in server.js
 */

require('dotenv').config();
const sequelize = require('../config/db');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('[migration-004] ✅ Database connected');

    // 1. Backfill COMMENT/REPLY notifications — entityId is a Reply UUID
    const [commentResults] = await sequelize.query(`
      UPDATE notifications n
      INNER JOIN replies r ON n.entityId = r.id
      SET n.postId = r.contentId
      WHERE n.postId IS NULL
        AND n.type IN ('COMMENT', 'REPLY')
    `);
    console.log(`[migration-004] ✅ COMMENT/REPLY backfill: ${commentResults.affectedRows ?? 0} rows updated`);

    // 2. Backfill LIKE/REPOST notifications — entityId IS the post/reel ID
    const [likeResults] = await sequelize.query(`
      UPDATE notifications
      SET postId = entityId
      WHERE postId IS NULL
        AND type IN ('LIKE', 'REPOST')
        AND entityType IN ('POST', 'REEL')
    `);
    console.log(`[migration-004] ✅ LIKE/REPOST backfill: ${likeResults.affectedRows ?? 0} rows updated`);

    console.log('[migration-004] ✅ Backfill complete');
  } catch (err) {
    console.error('[migration-004] ❌ Backfill failed:', err.message);
  }
};

module.exports = run;

// Allow direct execution: node migrations/004-backfill-notification-postId.js
if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}
