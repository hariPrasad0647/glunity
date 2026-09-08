const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if actor is deleted
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    type: {
      type: DataTypes.ENUM('FOLLOW', 'LIKE', 'COMMENT', 'REPOST', 'REPLY'),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['recipientId'] },
      { fields: ['recipientId', 'isRead'] },
      { fields: ['recipientId', 'createdAt'] },
      { fields: ['actorId'] },
      { fields: ['type'] },
    ],
  }
);

Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });

module.exports = Notification;
