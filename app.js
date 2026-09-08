const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const dailyActivity = require('./middleware/dailyActivity');
const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/user/routes/user.routes');
const postRoutes = require('./modules/post/routes/post.routes');
const reelRoutes = require('./modules/reel/routes/reel.routes');
const chatRoutes = require('./modules/chat/routes/chat.routes');
const feedRoutes = require('./modules/feed/routes/feed.routes');
const storyRoutes = require('./modules/story/routes/story.routes');
const contentRoutes = require('./modules/content/routes/content.routes');
const pointsRoutes = require('./modules/points/routes/points.routes');
const referralRoutes = require('./modules/referral/routes/referral.routes');
const trustScoreRoutes = require('./modules/trust-score/routes/trust-score.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');

const app = express();

const allowedOrigins = [
  'https://happychats.in',
  'https://www.happychats.in',
];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// app.use('/api/', apiLimiter);

// Daily activity points — fires non-blocking on every authenticated request
app.use(dailyActivity);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/trust-score', trustScoreRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

module.exports = app;
