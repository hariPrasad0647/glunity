'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'bannerImage', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'profileImage',
    });

    await queryInterface.addColumn('users', 'bannerVideo', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'bannerImage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'bannerVideo');
    await queryInterface.removeColumn('users', 'bannerImage');
  },
};
