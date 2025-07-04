import { Op } from 'sequelize';
import { BaseRepository } from './base.repository';
import User from '../models/user.model';

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super(User);
    }

    /**
     * Find a user by email or username
     */
    async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return this.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username }
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

    /**
     * Update user's monthly data
     */
    async updateMonthlyData(userId: number, monthlyBudget: number, monthlyIncome: number): Promise<number> {
        return this.update(
            { monthly_budget: monthlyBudget, monthly_income: monthlyIncome },
            { where: { user_id: userId } }
        );
    }

    /**
     * Update user's token
     */
    async updateToken(userId: number, token: string): Promise<number> {
        return this.update(
            { token },
            { where: { user_id: userId } }
        );
    }
} 