import { Model, DataTypes } from 'sequelize';
import { sequelize } from './index';
import User from './user.model';

export class UserToken extends Model {
    public id!: number;
    public user_id!: number;
    public access_token!: string | null;
    public refresh_token!: string | null;
    public expires_at!: Date | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Associations
    public readonly tokenOwner?: User;
}

UserToken.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    access_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'UserToken',
    tableName: 'user_tokens',
    timestamps: true,
    underscored: true
});

export default UserToken; 