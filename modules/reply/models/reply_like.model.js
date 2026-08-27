const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');
const Reply = require('./reply.model');

const ReplyLike = sequelize.define(
  'ReplyLike',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    replyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'replies', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'reply_likes',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['userId', 'replyId'] }],
  }
);

ReplyLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReplyLike.belongsTo(Reply, { foreignKey: 'replyId' });
Reply.hasMany(ReplyLike, { foreignKey: 'replyId', as: 'likes' });

module.exports = ReplyLike;
