require('dotenv').config();
const sequelize = require('./config/db');

async function fix() {
  try {
    await sequelize.query('ALTER TABLE `posts` ADD COLUMN `quotedPostId` CHAR(36) BINARY;');
    console.log('Successfully added quotedPostId column to posts table.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}
fix();
