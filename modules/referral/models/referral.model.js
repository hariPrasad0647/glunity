const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');

const Referral = sequelize.define(
  'Referral',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    referrerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    referredUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      // One referral per referred user (handled by index)
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FLAGGED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    profileCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstPostAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pointsAwarded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    flagged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    flagReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'referrals',
    timestamps: true,
    indexes: [
      { fields: ['referrerId'] },
      { unique: true, fields: ['referredUserId'] },
      { fields: ['referralCode'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Referral;
