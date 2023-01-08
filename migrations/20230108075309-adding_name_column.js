'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addColumn('Admins', 'name', {
              type: Sequelize.STRING
          }, { transaction: t }),
          queryInterface.addColumn('Voters', 'name', {
            type: Sequelize.STRING
        }, { transaction: t }),
      ])
    })
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeColumn('Admins', 'name', { transaction: t }),
          queryInterface.removeColumn('Voters', 'name', { transaction: t }),
      ])
    })
  }
  
};
