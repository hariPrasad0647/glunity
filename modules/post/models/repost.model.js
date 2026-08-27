const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Repost = sequelize.define(
  'Repost',
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
    contentType: {
      type: DataTypes.ENUM('post', 'reel'),
      allowNull: false,
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: 'reposts',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['userId', 'contentType', 'contentId'] }],
  }
);

Repost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Repost;
