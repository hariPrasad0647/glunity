const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const TrustScore = sequelize.define(
  'TrustScore',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    onChainScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    smartFollowersScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    engagementScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    longevityScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    reportsScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 100, // Starts at 100
    },
    finalScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    tier: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'UNVERIFIED',
    },
    monetizationEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'trust_scores',
    timestamps: true,
  }
);

TrustScore.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(TrustScore, { foreignKey: 'userId', as: 'trustScore' });

module.exports = TrustScore;
