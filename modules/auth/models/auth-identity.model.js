const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const AuthIdentity = sequelize.define(
  'AuthIdentity',
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
    provider: {
      type: DataTypes.ENUM('GOOGLE', 'APPLE'),
      allowNull: false,
    },
    providerUserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'auth_identities',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['provider', 'providerUserId'],
      },
    ],
  }
);

AuthIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuthIdentity, { foreignKey: 'userId', as: 'identities' });

module.exports = AuthIdentity;
