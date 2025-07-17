import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';
import User from './user.model';

export class EmailVerificationCode extends Model {
  public id!: number;
  public user_id!: string;
  public code!: string;
  public expires_at!: Date;
  public used!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmailVerificationCode.init({
  id: {
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
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'EmailVerificationCode',
  tableName: 'email_verification_codes',
  timestamps: true,
  underscored: true,
});

EmailVerificationCode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default EmailVerificationCode; 