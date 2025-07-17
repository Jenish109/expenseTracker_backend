import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface PasswordResetCodeAttributes {
  id: number;
  user_id: number;
  code: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

type PasswordResetCodeCreationAttributes = Optional<PasswordResetCodeAttributes, 'id' | 'used' | 'created_at'>;

class PasswordResetCode extends Model<PasswordResetCodeAttributes, PasswordResetCodeCreationAttributes>
  implements PasswordResetCodeAttributes {
  public id!: number;
  public user_id!: number;
  public code!: string;
  public expires_at!: Date;
  public used!: boolean;
  public created_at!: Date;
}

PasswordResetCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'password_reset_codes',
    timestamps: false,
    underscored: true,
  }
);

export default PasswordResetCode; 