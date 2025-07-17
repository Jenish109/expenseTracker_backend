import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../utils/errorCodes";
import type { CreateBudgetDTO, UpdateBudgetDTO, BudgetWithCategory } from "../interfaces/budget.interface";
import { BudgetRepository } from "../repositories/budget.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { UserRepository } from "../repositories/user.repository";
import { Pool } from "mysql2/promise";
import BudgetModel from '../models/budget.model';
import { MESSAGES } from "../utils/constants";

export class BudgetService {
    private budgetRepository: BudgetRepository;
    private categoryRepository: CategoryRepository;
    private expenseRepository: ExpenseRepository;
    private userRepository: UserRepository;

    constructor() {
        this.budgetRepository = new BudgetRepository(BudgetModel);
        this.categoryRepository = new CategoryRepository();
        this.expenseRepository = new ExpenseRepository();
        this.userRepository = new UserRepository();
    }

    /**
     * Add a new budget for a user
     */
    async addBudget(userId: number, data: CreateBudgetDTO): Promise<void> {
        // Validate input
        if (!data.amount || data.amount <= 0) {
            throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Budget amount must be greater than 0"]);
        }

        if (!data.categoryId) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category ID is required"]);
        }

        // Check if category exists
        const category = await this.categoryRepository.findById(data.categoryId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Validate and parse dates
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1); // Default to one month if no end date

        if (startDate > endDate) {
            throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Start date cannot be after end date"]);
        }
        
        // Create new budget
        await BudgetModel.create({
            user_id: userId,
            category_id: data.categoryId,
            amount: data.amount,
            start_date: startDate,
            end_date: endDate
        });
    }

    /**
     * Get budget list with spending information for a user
     */
    async getBudgetListWithSpending(
        userId: number,
        options?: {
            page?: number;
            limit?: number;
            search?: string;
            categoryId?: number;
        }
    ): Promise<{
        total_budget: number;
        spent_amount: number;
        remaining_amount: number;
        budget_list: Array<BudgetWithCategory & {
            current_amount: number;
            remaining_amount: number;
            utilization_percentage: number;
        }>;
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }> {
        // Get user data
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Get budgets with categories and spending
        const budgetResult = await this.budgetRepository.findAllByUserWithCategoryAndSpending(userId, options);

        // Get total expense
        const total_expense = await this.expenseRepository.getTotalExpensesByUserId(userId);

        // Transform budget data to avoid circular references
        const transformedBudgets = await Promise.all(budgetResult.data.map(async (budget) => {
            const currentAmount = await this.expenseRepository.getTotalExpensesByCategory(userId, budget.category_id);
            const remaining = budget.amount - currentAmount;
            const utilization = (currentAmount / budget.amount) * 100;

            return {
                budget_id: budget.budget_id,
                user_id: budget.user_id,
                category_id: budget.category_id,
                amount: budget.amount,
                start_date: budget.start_date,
                end_date: budget.end_date,
                created_at: budget.created_at,
                updated_at: budget.updated_at,
                category: {
                    category_id: budget.category.category_id,
                    category_name: budget.category.category_name,
                    category_color: budget.category.category_color,
                    created_at: budget.category.created_at
                },
                current_amount: currentAmount,
                remaining_amount: remaining,
                utilization_percentage: Math.min(Math.round(utilization * 100) / 100, 100)
            };
        }));

        return {
            total_budget: Number(user.monthly_budget) || 0,
            spent_amount: total_expense,
            remaining_amount: Number(user.monthly_budget) > total_expense ? Number(user.monthly_budget) - total_expense : 0,
            budget_list: transformedBudgets,
            page: budgetResult.page,
            limit: budgetResult.limit,
            total: budgetResult.total,
            totalPages: budgetResult.totalPages
        };
    }

    /**
     * Get budgets that are over their limit
     */
    async getBudgetsOverLimit(userId: number) {
        return this.budgetRepository.getBudgetsOverLimit(userId);
    }

    /**
     * Get budget summary for a user
     */
    async getBudgetSummary(userId: number) {
        return this.budgetRepository.getBudgetSummaryByUser(userId);
    }

    /**
     * Update budget
     */
    async updateBudget(budgetId: number, userId: number, data: UpdateBudgetDTO) {
        // Validate amount if provided
        if (data.amount && data.amount <= 0) {
            throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Budget amount must be greater than 0"]);
        }

        // Validate category if provided
        if (data.categoryId) {
            const category = await this.categoryRepository.findById(data.categoryId);
            if (!category) {
                throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
            }
        }

        // Validate dates
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (startDate > endDate) {
                throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Start date cannot be after end date"]);
            }
        }

        // Update budget
        const budget = await this.budgetRepository.updateBudget(budgetId, userId, data);
        if (!budget) {
            throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Budget not found"]);
        }

        return this.getBudgetById(budgetId, userId);
    }

    /**
     * Delete budget
     */
    async deleteBudget(budgetId: number, userId: number) {
        const success = await this.budgetRepository.deleteBudget(budgetId, userId);
        if (!success) {
            throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Budget not found"]);
        }
    }

    /**
     * Get paginated budgets
     */
    async getPaginatedBudgets(userId: number, page?: number, limit?: number) {
        return this.budgetRepository.findPaginatedByUser(userId, { page, limit });
    }

    /**
     * Get budget by ID
     */
    async getBudgetById(budgetId: number, userId: number): Promise<BudgetWithCategory> {
        const budget = await this.budgetRepository.findByIdWithCategoryAndSpending(budgetId, userId);
        if (!budget) {
            throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Budget not found"]);
        }

        // Get current spending for this budget's category
        const currentAmount = await this.expenseRepository.getTotalExpensesByCategory(userId, budget.category_id);
        
        // Calculate remaining amount and utilization
        const remaining = budget.amount - currentAmount;
        const utilization = (currentAmount / budget.amount) * 100;

        // Transform the data to avoid circular references
        return {
            budget_id: budget.budget_id,
            user_id: budget.user_id,
            category_id: budget.category_id,
            amount: budget.amount,
            start_date: budget.start_date,
            end_date: budget.end_date,
            created_at: budget.created_at,
            updated_at: budget.updated_at,
            category: {
                category_id: budget.category.category_id,
                category_name: budget.category.category_name,
                category_color: budget.category.category_color,
                created_at: budget.category.created_at
            },
            current_amount: currentAmount,
            remaining_amount: remaining,
            utilization_percentage: Math.min(Math.round(utilization * 100) / 100, 100)
        };
    }
}