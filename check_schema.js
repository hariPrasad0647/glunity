require('dotenv').config();
const { Sequelize } = require('sequelize');

async function check() {
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
    const [tables] = await sequelize.query('SHOW TABLES;');
    console.log('Tables:', tables);

    if (tables.some(t => Object.values(t)[0] === 'posts')) {
      const [schema] = await sequelize.query('DESCRIBE posts;');
      console.log('\nPosts schema:');
      console.table(schema);

      const [indexes] = await sequelize.query('SHOW INDEX FROM posts;');
      console.log('\nPosts indexes:');
      console.table(indexes);

      const [count] = await sequelize.query('SELECT COUNT(*) as count FROM posts;');
      console.log('\nTotal posts:', count[0].count);
    } else {
      console.log('\nThe "posts" table does not exist in this database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}
check();
