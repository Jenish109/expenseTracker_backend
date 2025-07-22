import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';

class User extends Model {
  public user_id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public first_name!: string;
  public last_name!: string;
  public email_verified!: boolean;
  public login_count!: number;
  public auth_provider!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // You can add custom instance methods here
  public toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init({
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  auth_provider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'email',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User; 