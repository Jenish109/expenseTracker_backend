import { Sequelize } from 'sequelize';
import config from '../config/database.config';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof typeof config];

// Create Sequelize instance
export const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: 'mysql',
        logging: dbConfig.logging
    }
);

// Import models
import User from './user.model';
import Category from './category.model';
import Expense from './expense.model';
import Budget from './budget.model';
import UserToken from './userToken.model';
import UserMonthlyFinance from './userMonthlyFinance.model';

// Define associations after all models are initialized
const initializeAssociations = () => {
    // User associations
    User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses' });
    User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
    User.hasMany(UserToken, { foreignKey: 'user_id', as: 'tokens' });
    User.hasMany(UserMonthlyFinance, { foreignKey: 'user_id', as: 'monthlyFinances' });

    // Category associations
    Category.hasMany(Expense, { foreignKey: 'category_id', as: 'expenses' });
    Category.hasMany(Budget, { foreignKey: 'category_id', as: 'budgets' });

    // Expense associations
    Expense.belongsTo(User, { foreignKey: 'user_id', as: 'expenseOwner' });
    Expense.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

    // Budget associations
    Budget.belongsTo(User, { foreignKey: 'user_id', as: 'budgetOwner' });
    Budget.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

    // UserToken associations
    UserToken.belongsTo(User, { foreignKey: 'user_id', as: 'tokenOwner' });

    // UserMonthlyFinance associations
    UserMonthlyFinance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

// Initialize associations
initializeAssociations();

export {
    User,
    Category,
    Expense,
    Budget,
    UserToken,
    UserMonthlyFinance
}; 