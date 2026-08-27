require('dotenv').config();
const { Sequelize } = require('sequelize');

async function fix() {
  try {
    // Connect to default 'test' database to ensure we can execute CREATE DATABASE
    const tempSequelize = new Sequelize('test', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      },
    });

    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Ensured database ${process.env.DB_NAME} exists.`);
    await tempSequelize.close();

    // Now connect to the actual database
    const sequelize = require('./config/db');
    // Ensure tables exist before we alter
    await sequelize.sync(); 
    
    // We ignore if the column doesn't exist to prevent crashes if run multiple times
    await sequelize.query('ALTER TABLE `posts` CHANGE `caption` `content` TEXT;');
    console.log('Successfully renamed caption to content in posts table.');
  } catch (err) {
    if (err.message.includes("Unknown column 'caption'")) {
      console.log('Column already renamed.');
    } else {
      console.error('Error:', err.message);
    }
  } finally {
    process.exit(0);
  }
}
fix();
