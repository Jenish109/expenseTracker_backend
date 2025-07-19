import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';
import User from './user.model';

class Category extends Model {
  public category_id!: number;
  public category_name!: string;
  public category_color!: string;
  public user_id!: number | null;
  public is_default!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Category.init({
  category_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  category_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  tableName: 'categories',
  timestamps: true,
  underscored: true
});

// Define associations
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });

export default Category; 