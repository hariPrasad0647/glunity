require('dotenv').config();
const sequelize = require('../config/db');

async function migrate() {
  try {
    console.log(`Connecting to ${process.env.DB_HOST} -> ${process.env.DB_NAME}...`);
    await sequelize.authenticate();
    
    // 1. Verify schema
    const [tables] = await sequelize.query('SHOW TABLES;');
    const tableExists = tables.some(t => Object.values(t)[0] === 'messages');
    if (!tableExists) {
      console.log('❌ "messages" table does not exist in this database. Migration aborted.');
      return;
    }

    const [schemaBefore] = await sequelize.query('DESCRIBE messages;');
    const statusCol = schemaBefore.find(col => col.Field === 'status');
    
    if (statusCol) {
      console.log('✅ "status" column already exists. Migration was already run.');
      return;
    }

    // 2. Execute Migration
    console.log('\nExecuting: ALTER TABLE `messages` ADD COLUMN `status` ENUM(\'sent\', \'seen\') NOT NULL DEFAULT \'sent\';');
    await sequelize.query('ALTER TABLE `messages` ADD COLUMN `status` ENUM(\'sent\', \'seen\') NOT NULL DEFAULT \'sent\';');
    console.log('✅ Migration successful!\n');

    // 3. Verify schema after
    const [schemaAfter] = await sequelize.query('DESCRIBE messages;');
    console.log('New status column:', schemaAfter.find(col => col.Field === 'status'));

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}
migrate();
