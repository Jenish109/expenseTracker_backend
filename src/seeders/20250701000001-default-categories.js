'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        category_name: 'Food & Dining',
        category_color: '#FF5733',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Transportation',
        category_color: '#33FF57',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Housing',
        category_color: '#3357FF',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Entertainment',
        category_color: '#FF33F6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Shopping',
        category_color: '#33FFF6',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Healthcare',
        category_color: '#F6FF33',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Education',
        category_color: '#FF8333',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Bills & Utilities',
        category_color: '#33FFB2',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name: 'Other',
        category_color: '#808080',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
}; 