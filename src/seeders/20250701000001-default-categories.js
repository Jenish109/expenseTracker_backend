'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Food & Dining',
        description: 'Restaurants, groceries, and food delivery',
        icon: '🍽️',
        color: '#FF5733',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Transportation',
        description: 'Public transit, fuel, car maintenance',
        icon: '🚗',
        color: '#33FF57',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Housing',
        description: 'Rent, utilities, maintenance',
        icon: '🏠',
        color: '#3357FF',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Entertainment',
        description: 'Movies, games, hobbies',
        icon: '🎮',
        color: '#FF33F6',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Shopping',
        description: 'Clothing, electronics, general retail',
        icon: '🛍️',
        color: '#33FFF6',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Healthcare',
        description: 'Medical expenses, pharmacy, insurance',
        icon: '⚕️',
        color: '#F6FF33',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Education',
        description: 'Tuition, books, courses',
        icon: '📚',
        color: '#FF8333',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bills & Utilities',
        description: 'Phone, internet, subscriptions',
        icon: '📱',
        color: '#33FFB2',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Other',
        description: 'Miscellaneous expenses',
        icon: '📦',
        color: '#808080',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', {
      is_default: true
    }, {});
  }
}; 