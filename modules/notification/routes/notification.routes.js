const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');
const auth = require('../../../middleware/auth');
const { uuidParam } = require('../../../utils/paramValidators');
const validate = require('../../../middleware/validate');

const router = express.Router();

router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', uuidParam('id'), validate, markAsRead);

module.exports = router;
