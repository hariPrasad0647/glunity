const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Reply = sequelize.define(
  'Reply',
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
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'replies', key: 'id' },
      onDelete: 'CASCADE',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'replies',
    timestamps: true,
  }
);

Reply.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Reply.hasMany(Reply, { foreignKey: 'parentId', as: 'replies' });
Reply.belongsTo(Reply, { foreignKey: 'parentId', as: 'parent' });

module.exports = Reply;
