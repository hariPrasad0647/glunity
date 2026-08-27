require('dotenv').config();
const { Sequelize } = require('sequelize');

async function migrate() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      },
    }
  );

  try {
    console.log(`Connecting to ${process.env.DB_HOST} -> ${process.env.DB_NAME}...`);
    await sequelize.authenticate();
    
    // 1. Verify schema
    const [tables] = await sequelize.query('SHOW TABLES;');
    const tableExists = tables.some(t => Object.values(t)[0] === 'posts');
    if (!tableExists) {
      console.log('❌ "posts" table does not exist in this database. Migration aborted.');
      return;
    }

    const [schemaBefore] = await sequelize.query('DESCRIBE posts;');
    const captionCol = schemaBefore.find(col => col.Field === 'caption');
    
    if (!captionCol) {
      const contentCol = schemaBefore.find(col => col.Field === 'content');
      if (contentCol) {
        console.log('✅ "content" column already exists. Migration was already run.');
        return;
      }
      console.log('❌ "caption" column not found in "posts" table. Cannot migrate.');
      return;
    }

    console.log('Current caption column:', captionCol);

    // 2. Count rows before
    const [countBefore] = await sequelize.query('SELECT COUNT(*) as count FROM posts;');
    console.log(`Rows in posts table before migration: ${countBefore[0].count}`);

    // 3. Execute Migration
    console.log('\nExecuting: ALTER TABLE `posts` CHANGE `caption` `content` TEXT;');
    await sequelize.query('ALTER TABLE `posts` CHANGE `caption` `content` TEXT;');
    console.log('✅ Migration successful!\n');

    // 4. Verify schema and counts after
    const [schemaAfter] = await sequelize.query('DESCRIBE posts;');
    console.log('New content column:', schemaAfter.find(col => col.Field === 'content'));

    const [countAfter] = await sequelize.query('SELECT COUNT(*) as count FROM posts;');
    console.log(`Rows in posts table after migration: ${countAfter[0].count}`);

    if (countBefore[0].count === countAfter[0].count) {
      console.log('✅ Row counts match perfectly.');
    } else {
      console.log('⚠️ Row counts changed unexpectedly during migration.');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}
migrate();
