const Notification = require('../models/notification.model');
const User = require('../../user/models/user.model');

const createNotification = async ({ recipientId, actorId, type, message, entityId, entityType, transaction }) => {
  if (recipientId === actorId) {
    return null; // Do not notify yourself
  }

  return await Notification.create({
    recipientId,
    actorId,
    type,
    message,
    entityId,
    entityType,
  }, { transaction });
};

const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  
  const { count, rows } = await Notification.findAndCountAll({
    where: { recipientId: userId },
    include: [
      { 
        model: User, 
        as: 'actor', 
        attributes: ['id', 'username', 'fullName', 'profileImage'] 
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return {
    notifications: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / Number(limit))
    }
  };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { recipientId: userId, isRead: false },
  });
  return count;
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, recipientId: userId },
  });

  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update(
    { isRead: true },
    { where: { recipientId: userId, isRead: false } }
  );
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
