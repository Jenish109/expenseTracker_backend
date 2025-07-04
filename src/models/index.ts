import { Sequelize } from 'sequelize';
import { initUserModel } from './user.model';
import { initCategoryModel } from './category.model';
import { initExpenseModel } from './expense.model';
import { initBudgetModel } from './budget.model';
// @ts-ignore
import config from '../config/database.config';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof typeof config];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Initialize models
const User = initUserModel(sequelize);
const Category = initCategoryModel(sequelize);
const Expense = initExpenseModel(sequelize);
const Budget = initBudgetModel(sequelize);

// Define associations
User.hasMany(Expense, {
  foreignKey: 'user_id',
  as: 'expenses'
});
Expense.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Budget, {
  foreignKey: 'user_id',
  as: 'budgets'
});
Budget.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Category.hasMany(Expense, {
  foreignKey: 'category_id',
  as: 'expenses'
});
Expense.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(Budget, {
  foreignKey: 'category_id',
  as: 'budgets'
});
Budget.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// Export models and sequelize instance
export {
  sequelize,
  User,
  Category,
  Expense,
  Budget
}; 