const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Could not connect to Redis:', err);
  }
};

module.exports = {
  redisClient,
  connectRedis,
};
