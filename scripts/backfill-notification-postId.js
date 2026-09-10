/**
 * Backfill script: Populate postId for existing COMMENT/REPLY notifications.
 *
 * The entityId on these notifications points to a Reply record.
 * We join against the replies table to get the contentId (which is the post/reel ID).
 *
 * Usage: node scripts/backfill-notification-postId.js
 */

require('dotenv').config();
const sequelize = require('../config/db');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // MySQL UPDATE with JOIN syntax
    const [results] = await sequelize.query(`
      UPDATE notifications n
      INNER JOIN replies r ON n.entityId = r.id
      SET n.postId = r.contentId
      WHERE n.postId IS NULL
        AND n.type IN ('COMMENT', 'REPLY')
    `);

    console.log(`✅ Backfill complete. Rows updated: ${results.affectedRows ?? results.changedRows ?? 'unknown'}`);

    // Also backfill LIKE and REPOST notifications where entityId is the post/reel ID directly
    const [likeResults] = await sequelize.query(`
      UPDATE notifications
      SET postId = entityId
      WHERE postId IS NULL
        AND type IN ('LIKE', 'REPOST')
        AND entityType IN ('POST', 'REEL')
    `);

    console.log(`✅ LIKE/REPOST backfill complete. Rows updated: ${likeResults.affectedRows ?? likeResults.changedRows ?? 'unknown'}`);

  } catch (err) {
    console.error('❌ Backfill failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

run();
