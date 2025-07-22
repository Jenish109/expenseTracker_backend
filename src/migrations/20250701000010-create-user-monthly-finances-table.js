'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_monthly_finances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      monthly_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      monthly_income: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      period: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('user_monthly_finances', ['user_id', 'period'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_monthly_finances');
  }
}; 