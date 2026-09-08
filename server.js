const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');
const registerChatSocket = require('./modules/chat/socket/chat.socket');

// Chat models
require('./modules/chat/models/conversation.model');
require('./modules/chat/models/conversationParticipant.model');
require('./modules/chat/models/message.model');
require('./modules/chat/models/messageMedia.model');

// Story models
require('./modules/story/models/story.model');
require('./modules/story/models/storyView.model');
require('./modules/story/models/storyReaction.model');

// Reply models
require('./modules/reply/models/reply.model');
require('./modules/reply/models/reply_like.model');

// Points models
require('./modules/points/models/pointTransaction.model');

// Referral models
require('./modules/referral/models/referral.model');

// Trust Score models
require('./modules/trust-score/models/trust-score.model');
require('./modules/trust-score/models/trust-score-history.model');

const { initTrustScoreScheduler } = require('./modules/trust-score/cron/trust-score.cron');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectRedis();

    const app = require('./app');
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    registerChatSocket(io);

    app.set('io', io);

    await sequelize.authenticate();
    
    // Workaround for TiDB/MySQL issue: cannot add column and foreign key constraint in the same ALTER statement
    try {
      await sequelize.query('ALTER TABLE `messages` ADD COLUMN `replyToId` CHAR(36) BINARY');
    } catch (e) {
      // Ignore error if column already exists
    }

    await sequelize.sync({ alter: true });
    logger.info('Database connected');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      
      initTrustScoreScheduler();

      // Keep Render free tier awake by self-pinging every 14 mins
      const url = process.env.RENDER_EXTERNAL_URL;
      if (url) {
        const https = require('https');
        setInterval(() => {
          https.get(`${url}/health`, (res) => {
            if (res.statusCode === 200) {
              logger.info('Self-ping successful');
            } else {
              logger.warn(`Self-ping status: ${res.statusCode}`);
            }
          }).on('error', (err) => {
            logger.error(`Self-ping failed: ${err.message}`);
          });
        }, 14 * 60 * 1000); // 14 minutes
        
        logger.info(`Self-ping scheduled for ${url} every 14 minutes`);
      }
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
