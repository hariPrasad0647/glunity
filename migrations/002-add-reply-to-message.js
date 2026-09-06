'use strict';

require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = {
  async up() {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('messages', 'replyToId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'messages', key: 'id' },
      onDelete: 'SET NULL',
      after: 'reactionEmoji', // MySQL — ignored by Postgres
    });
  },

  async down() {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('messages', 'replyToId');
  },
};

// Run directly: node migrations/002-add-reply-to-message.js
if (require.main === module) {
  (async () => {
    try {
      await module.exports.up();
      console.log('✅  Migration UP: replyToId column added to messages');
    } catch (err) {
      console.error('❌  Migration failed:', err.message);
    } finally {
      await sequelize.close();
    }
  })();
}
