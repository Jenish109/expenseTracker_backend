import { Pool, RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from './base.repository';
import { Budget, BudgetWithCategory, CreateBudgetDTO, UpdateBudgetDTO } from '../interfaces/budget.interface';
import { QueryParams } from '../interfaces/base.interface';
import BudgetModel from '../models/budget.model';
import { TABLES } from '../utils/constants';
import Category from '../models/category.model';

export interface BudgetRow extends RowDataPacket, Budget {}

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
        // Example: Use findOne with include for category and expenses if defined in the model
        const budget = await this.model.findOne({
            where: { budget_id: budgetId, user_id: userId },
            include: [
                // Add associations for category and expenses if defined in the model
            ]
        });
        // TODO: Map to BudgetWithCategory if needed
        return budget as unknown as BudgetWithCategory;
    }

    /**
     * Get all budgets for user with category and spending information
     */
    async findAllByUserWithCategoryAndSpending(userId: number): Promise<BudgetWithCategory[]> {
        const budgets = await this.model.findAll({
            where: { user_id: userId },
            include: [
                // Add associations for category and expenses if defined in the model
            ]
        });
        // TODO: Map to BudgetWithCategory if needed
        return budgets as unknown as BudgetWithCategory[];
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
        const [affectedRows] = await this.model.update(updateData, { where: { budget_id: budgetId, user_id: userId } });
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
} 