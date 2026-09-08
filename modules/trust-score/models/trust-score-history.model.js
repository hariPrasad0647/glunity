const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const TrustScoreHistory = sequelize.define(
  'TrustScoreHistory',
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
    onChainScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    smartFollowersScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    engagementScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longevityScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    reportsScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    finalScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    tier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    calculationReason: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'WEEKLY', // WEEKLY, CRITICAL_REPORT, MANUAL_RECALCULATION
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'trust_score_history',
    timestamps: true,
    updatedAt: false, // We don't need updatedAt for history, it's immutable
  }
);

TrustScoreHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TrustScoreHistory, { foreignKey: 'userId', as: 'trustScoreHistory' });

module.exports = TrustScoreHistory;
