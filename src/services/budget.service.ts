import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
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
     * Validate that adding/updating a budget does not exceed the user's monthly budget
     * @param userId - user id
     * @param amount - new amount to add/update
     * @param startDate - start date of the budget
     * @param excludeBudgetId - (optional) budget id to exclude from sum (for update)
     * @throws CustomError if the new total would exceed the user's monthly budget
     */
    private async validateMonthlyBudgetLimit(userId: number, amount: number, startDate: Date, excludeBudgetId?: number) {
        // Get user and their monthly budget
        const user = await this.userRepository.findById(userId);
        if (!user || user.monthly_budget == null) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User or monthly budget not found"]);
        }
        const monthlyBudget = Number(user.monthly_budget);
        if (monthlyBudget <= 0) {
            throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Monthly budget must be greater than 0"]);
        }
        // Calculate the month and year for the budget being added/updated
        const month = (startDate.getMonth() + 1);
        const year = startDate.getFullYear();
        // Get sum of all budgets for this user in this month
        let currentMonthSum = await this.budgetRepository.getMonthlyBudgetSum(userId, month, year);
        // If updating, subtract the old amount of the current budget
        if (excludeBudgetId) {
            const oldBudget = await this.budgetRepository.findByIdAndUser(excludeBudgetId, userId);
            if (oldBudget) {
                currentMonthSum -= Number(oldBudget.amount);
            }
        }
        if (currentMonthSum + Number(amount) > monthlyBudget) {
            throw new CustomError(ERROR_CODES.BUDGET.LIMIT_EXCEEDED, ["Adding this budget would exceed your monthly budget. Remaining: " + (monthlyBudget - currentMonthSum)]);
        }
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

        // Validate monthly budget limit
        await this.validateMonthlyBudgetLimit(userId, Number(data.amount), startDate);

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
                    user_id: budget.category.user_id!,
                    is_default: budget.category.is_default,
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
        let startDate: Date | undefined = undefined;
        if (data.startDate && data.endDate) {
            startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (startDate > endDate) {
                throw new CustomError(ERROR_CODES.BUDGET.INVALID_AMOUNT, ["Start date cannot be after end date"]);
            }
        }

        // Validate monthly budget limit if amount or startDate is being updated
        if (data.amount && (data.startDate || data.endDate)) {
            await this.validateMonthlyBudgetLimit(userId, Number(data.amount), startDate || new Date(), budgetId);
        } else if (data.amount) {
            // If only amount is being updated, fetch the current budget's startDate
            const oldBudget = await this.budgetRepository.findByIdAndUser(budgetId, userId);
            if (oldBudget) {
                await this.validateMonthlyBudgetLimit(userId, Number(data.amount), oldBudget.start_date, budgetId);
            }
        } else if (data.startDate) {
            // If only startDate is being updated, fetch the current budget's amount
            const oldBudget = await this.budgetRepository.findByIdAndUser(budgetId, userId);
            if (oldBudget) {
                await this.validateMonthlyBudgetLimit(userId, Number(oldBudget.amount), new Date(data.startDate), budgetId);
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
                user_id: budget.category.user_id!,
                is_default: budget.category.is_default,
                created_at: budget.category.created_at
            },
            current_amount: currentAmount,
            remaining_amount: remaining,
            utilization_percentage: Math.min(Math.round(utilization * 100) / 100, 100)
        };
    }
}