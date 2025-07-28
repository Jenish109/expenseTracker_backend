import { Pool, RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from './base.repository';
import { Budget, BudgetWithCategory, CreateBudgetDTO, UpdateBudgetDTO } from '../interfaces/budget.interface';
import { QueryParams } from '../interfaces/base.interface';
import BudgetModel from '../models/budget.model';
import { TABLES } from '../utils/constants';
import Category from '../models/category.model';
import { Op, WhereOptions } from 'sequelize';
import { handleDatabaseError } from '../utils/errorHandler';

export interface BudgetRow extends RowDataPacket, Budget { }

export class BudgetRepository extends BaseRepository<BudgetModel> {
    constructor(model: typeof BudgetModel) {
        super(model);
    }

    /**
     * Create a new budget
     */
    async createBudget(userId: number, budgetData: CreateBudgetDTO): Promise<BudgetModel> {
        const budget = await this.model.create({
            user_id: userId,
            category_id: budgetData.categoryId,
            amount: budgetData.amount,
            start_date: new Date(budgetData.startDate),
            end_date: new Date(budgetData.endDate)
        });
        return budget;
    }

    /**
     * Find budget by ID with user validation
     */
    async findByIdAndUser(budgetId: number, userId: number): Promise<BudgetModel | null> {
        return this.model.findOne({
            where: { budget_id: budgetId, user_id: userId },
            include: [{
                model: Category,
                as: 'category'
            }]
        });
    }

    /**
     * Find budget by category and user
     */
    async findByCategoryAndUser(categoryId: number, userId: number): Promise<BudgetModel | null> {
        return this.model.findOne({
            where: { category_id: categoryId, user_id: userId },
            include: [{
                model: Category,
                as: 'category'
            }]
        });
    }

    /**
     * Get budget with category information and current spending
     */
    async findByIdWithCategoryAndSpending(budgetId: number, userId: number): Promise<BudgetWithCategory | null> {
        const budget = await this.model.findOne({
            where: { budget_id: budgetId, user_id: userId },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at']
            }]
        });

        if (!budget) {
            return null;
        }

        return budget as unknown as BudgetWithCategory;
    }

    /**
     * Get all budgets for user with category and spending information
     */
    async findAllByUserWithCategoryAndSpending(
        userId: number,
        options?: {
            page?: number;
            limit?: number;
            search?: string;
            categoryId?: number;
        }
    ): Promise<{
        data: BudgetWithCategory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = { user_id: userId };
        if (options?.categoryId) {
            whereClause.category_id = options.categoryId;
        }

        // Include category with search condition if needed
        const categoryInclude: any = {
            model: Category,
            as: 'category',
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at']
        };

        if (options?.search) {
            categoryInclude.where = {
                category_name: {
                    [Op.like]: `%${options.search}%`
                }
            };
        }

        const { count, rows } = await this.model.findAndCountAll({
            where: whereClause,
            include: [categoryInclude],
            offset,
            limit,
            order: [['created_at', 'DESC']]
        });

        return {
            data: rows as unknown as BudgetWithCategory[],
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Get paginated budgets for user
     */
    async findPaginatedByUser(
        userId: number,
        params: QueryParams
    ): Promise<{ data: BudgetWithCategory[]; total: number }> {
        const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = params;
        const offset = (page - 1) * limit;
        const { count: total, rows } = await this.model.findAndCountAll({
            where: { user_id: userId },
            order: [[sort_by, sort_order]],
            offset,
            limit
        });
        // TODO: Map to BudgetWithCategory if needed
        return { data: rows as unknown as BudgetWithCategory[], total };
    }

    /**
     * Update budget
     */
    async updateBudget(budgetId: number, userId: number, updateData: UpdateBudgetDTO): Promise<BudgetModel | null> {
        const exists = await this.findByIdAndUser(budgetId, userId);
        if (!exists) {
            return null;
        }
        // Transform DTO fields to model fields
        const modelData = {
            amount: updateData.amount,
            category_id: updateData.categoryId,
            start_date: updateData.startDate ? new Date(updateData.startDate) : undefined,
            end_date: updateData.endDate ? new Date(updateData.endDate) : undefined
        };

        const [affectedRows] = await this.model.update(modelData, {
            where: { budget_id: budgetId, user_id: userId }
        });

        if (!affectedRows) {
            return null;
        }

        return this.findByIdAndUser(budgetId, userId);
    }

    /**
     * Update budget by category
     */
    async updateBudgetByCategory(categoryId: number, userId: number, amount: number): Promise<BudgetModel | null> {
        const existingBudget = await this.findByCategoryAndUser(categoryId, userId);
        if (existingBudget) {
            const [affectedRows] = await this.model.update({ amount }, { where: { budget_id: existingBudget.budget_id } });
            if (!affectedRows) {
                return null;
            }
            return this.findByIdAndUser(existingBudget.budget_id, userId);
        } else {
            return await this.createBudget(userId, {
                categoryId,
                amount,
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString()
            });
        }
    }

    /**
     * Delete budget
     */
    async deleteBudget(budgetId: number, userId: number): Promise<boolean> {
        const exists = await this.findByIdAndUser(budgetId, userId);
        if (!exists) {
            return false;
        }
        const deleted = await this.model.destroy({ where: { budget_id: budgetId, user_id: userId } });
        return deleted > 0;
    }

    /**
     * Get total budget amount for user
     */
    async getTotalBudgetByUser(userId: number): Promise<number> {
        // TODO: Implement using Sequelize sum method
        // Example:
        // const total = await this.model.sum('amount', { where: { user_id: userId } });
        // return total || 0;
        return 0;
    }

    /**
     * Get budget summary for user
     */
    async getBudgetSummaryByUser(userId: number): Promise<{
        total_budget: number;
        total_spent: number;
        remaining_budget: number;
        budget_count: number;
    }> {
        // TODO: Implement using Sequelize aggregate functions
        return {
            total_budget: 0,
            total_spent: 0,
            remaining_budget: 0,
            budget_count: 0
        };
    }

    /**
     * Check if a category is in use
     */
    async isCategoryInUse(categoryId: number): Promise<boolean> {
        const count = await this.model.count({ where: { category_id: categoryId } });
        return count > 0;
    }

    /**
     * Get budgets that are over limit
     */
    async getBudgetsOverLimit(userId: number): Promise<BudgetWithCategory[]> {
        // TODO: Implement using Sequelize queries and associations
        return [];
    }

    /**
     * Delete all budgets by user ID
     */
    async deleteByUserId(userId: number): Promise<void> {
        try {
            await this.delete({
                where: { user_id: userId } as WhereOptions<BudgetModel>
            });
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    /**
     * Get sum of all budgets for a user in a given month
     */
    async getMonthlyBudgetSum(userId: number, month: number, year: number): Promise<number> {
        // Sums all budgets for the user where the budget's month/year overlaps the given month/year
        const { fn, col, Op } = require('sequelize');
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const total = await this.model.sum('amount', {
            where: {
                user_id: userId,
                [Op.or]: [
                    {
                        start_date: {
                            [Op.between]: [startOfMonth, endOfMonth]
                        }
                    },
                    {
                        end_date: {
                            [Op.between]: [startOfMonth, endOfMonth]
                        }
                    },
                    {
                        start_date: { [Op.lte]: startOfMonth },
                        end_date: { [Op.gte]: endOfMonth }
                    }
                ]
            }
        });
        return Number(total) || 0;
    }

    /**
     * Find budget by category and month
     */
    async findByCategoryAndMonth(userId: number, categoryId: number, month: number, year: number): Promise<BudgetModel | null> {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        return this.model.findOne({
            where: {
                user_id: userId,
                category_id: categoryId,
                created_at: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });
    }
} 