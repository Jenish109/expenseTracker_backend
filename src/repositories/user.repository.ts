import { Op } from 'sequelize';
import { BaseRepository } from './base.repository';
import User from '../models/user.model';
import { handleDatabaseError } from '../utils/errorHandler';

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super(User);
    }

    /**
     * Create a new user
     */
    async create(data: {
        username: string;
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        email_verified?: boolean;
        auth_provider?: string;
    }): Promise<User> {
        return super.create(data);
    }

    /**
     * Find a user by email or username
     */
    async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return this.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username },
                ]
            }
        });
    }

    /**
     * Find a user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({
            where: { email }
        });
    }

    /**
     * Find a user by username
     */
    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({
            where: { username }
        });
    }

    async updateEmailVerificationStatus(userId: number, status: boolean): Promise<number> {
        return this.update({ email_verified: status }, { where: { user_id: userId } });
    }


    async updatePassword(userId: number, hashedPassword: string) {
        try {
            const updatedUser = await this.update({ password: hashedPassword }, { where: { user_id: userId } });
            return updatedUser;
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    async updateProfile(data: {
        firstName?: string;
        lastName?: string;
    }, userId: number): Promise<number> {
        try {
            const updatedUser = await this.update({ first_name: data.firstName, last_name: data.lastName }, { where: { user_id: userId } });
            return updatedUser;
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    /**
     * Delete a user by ID
     */
    async deleteById(userId: number): Promise<number> {
        try {
            const deleted = await this.delete({ where: { user_id: userId } });
            return deleted;
        } catch (error) {
            handleDatabaseError(error);
        }
    }
} 