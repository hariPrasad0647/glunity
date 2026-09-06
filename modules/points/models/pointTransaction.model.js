const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');
const { ACTIVITY_TYPES } = require('../constants/activity.constants');

const PointTransaction = sequelize.define(
  'PointTransaction',
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
    activityType: {
      type: DataTypes.ENUM(...Object.values(ACTIVITY_TYPES)),
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referenceType: {
      // e.g. 'post', 'reply', 'message'
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Core idempotency mechanism — unique constraint prevents any duplicate award
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'point_transactions',
    timestamps: true,
    updatedAt: false, // ledger rows are immutable
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'createdAt'] },
      { fields: ['userId', 'activityType'] },
      { fields: ['referenceId'] },
    ],
  }
);

PointTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PointTransaction, { foreignKey: 'userId', as: 'pointTransactions' });

module.exports = PointTransaction;
