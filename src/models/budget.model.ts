import { Model, DataTypes, Sequelize } from 'sequelize';
import Category from './category.model';
import User from './user.model';

class Budget extends Model {
  public budget_id!: number;
  public user_id!: number;
  public category_id!: number;
  public amount!: number;
  public start_date!: Date;
  public end_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly category!: Category;
  public readonly user?: User;

  // Helper method to ensure type safety when accessing category
  public getCategory(): Category {
    if (!this.category) {
      throw new Error('Category not loaded. Make sure to include the category in your query.');
    }
    return this.category;
  }
}

export const initBudgetModel = (sequelize: Sequelize) => {
  Budget.init({
    budget_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'expense_categories',
        key: 'category_id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    tableName: 'budgets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Budget;
};

export default Budget; 