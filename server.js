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
    await sequelize.sync({ alter: true });
    logger.info('Database connected');

    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
