import { Op, DestroyOptions, UpdateOptions } from 'sequelize';
import { BaseRepository } from './base.repository';
import { UserToken } from '../models/userToken.model';
import { IUserTokenCreate, IUserTokenUpdate } from '../interfaces/auth.interface';

export class UserTokenRepository extends BaseRepository<UserToken> {
    constructor() {
        super(UserToken);
    }

    async findByUserId(userId: number): Promise<UserToken[]> {
        return this.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
    }

    async findByRefreshToken(refreshToken: string): Promise<UserToken | null> {
        return this.findOne({
            where: { refresh_token: refreshToken }
        });
    }

    async findValidToken(userId: number, refreshToken: string): Promise<UserToken | null> {
        return this.findOne({
            where: {
                user_id: userId,
                refresh_token: refreshToken,
                expires_at: {
                    [Op.gt]: new Date() // Only get non-expired tokens
                }
            },
            order: [['created_at', 'DESC']] // Get the latest token
        });
    }

    async create(data: IUserTokenCreate): Promise<UserToken> {
        return super.create(data);
    }

    async update(data: IUserTokenUpdate, options: UpdateOptions<UserToken>): Promise<number> {
        return super.update(data, options);
    }

    async delete(options: DestroyOptions<UserToken>): Promise<number> {
        return super.delete(options);
    }

    async deleteByUserId(userId: number): Promise<number> {
        return this.delete({
            where: { user_id: userId }
        });
    }

    async deleteExpiredTokens(): Promise<number> {
        return this.delete({
            where: {
                expires_at: {
                    [Op.lt]: new Date() // Delete tokens that have expired
                }
            }
        });
    }
} 