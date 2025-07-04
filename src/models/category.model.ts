import { Model, DataTypes, Sequelize } from 'sequelize';

class Category extends Model {
  public category_id!: number;
  public category_name!: string;
  public category_color!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initCategoryModel = (sequelize: Sequelize) => {
  Category.init({
    category_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category_color: {
      type: DataTypes.STRING(7),
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
    tableName: 'expense_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Category;
};

export default Category; 