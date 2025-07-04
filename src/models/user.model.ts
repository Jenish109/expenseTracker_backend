import { Model, DataTypes, Sequelize } from 'sequelize';

class User extends Model {
  public user_id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public token!: string | null;
  public monthly_budget!: number | null;
  public monthly_income!: number | null;
  public email_verified!: boolean;
  public email_verification_token!: string | null;
  public password_reset_token!: string | null;
  public password_reset_expires!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // You can add custom instance methods here
  public toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

export const initUserModel = (sequelize: Sequelize) => {
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
    token: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    monthly_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    monthly_income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return User;
};

export default User; 