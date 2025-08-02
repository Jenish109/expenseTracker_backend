import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';

class Contact extends Model {
  public id!: number;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public subject?: string;
  public message?: string;
  public readonly created_at!: Date;
}

Contact.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'contact_us',
  timestamps: false,
  underscored: true
});

export default Contact; 