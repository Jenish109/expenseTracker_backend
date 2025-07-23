import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';

class UserMonthlyFinance extends Model {
  public id!: number;
  public userId!: number;
  public monthly_budget!: number | null;
  public monthly_income!: number | null;
  public period!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UserMonthlyFinance.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    field: 'user_id',
  },
  monthly_budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  monthly_income: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  period: {
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
  tableName: 'user_monthly_finances',
  timestamps: true,
  underscored: true,
});

export default UserMonthlyFinance; 