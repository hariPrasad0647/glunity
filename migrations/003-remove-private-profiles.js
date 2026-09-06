'use strict';

require('dotenv').config();
const sequelize = require('../config/db');

module.exports = {
  async up() {
    const queryInterface = sequelize.getQueryInterface();
    
    // 1. Remove isPrivate from users, posts, reels
    await queryInterface.removeColumn('users', 'isPrivate');
    await queryInterface.removeColumn('posts', 'isPrivate');
    await queryInterface.removeColumn('reels', 'isPrivate');
    
    // 2. Remove status from follows.
    // Note: Any existing row in follows is now an active follow, regardless of previous status.
    await queryInterface.removeColumn('follows', 'status');
  },

  async down() {
    const queryInterface = sequelize.getQueryInterface();
    const { DataTypes } = require('sequelize');
    
    await queryInterface.addColumn('users', 'isPrivate', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('posts', 'isPrivate', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('reels', 'isPrivate', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    
    await queryInterface.addColumn('follows', 'status', {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'accepted', // default to accepted if downgrading
    });
  },
};

// Run directly: node migrations/003-remove-private-profiles.js
if (require.main === module) {
  (async () => {
    try {
      await module.exports.up();
      console.log('✅  Migration UP: Removed isPrivate and follow status');
    } catch (err) {
      console.error('❌  Migration failed:', err);
    } finally {
      await sequelize.close();
    }
  })();
}
