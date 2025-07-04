import { ValidationService } from "./validation.service";
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
     * Add a new budget for a user
     */
    async addBudget(userId: number, data: CreateBudgetDTO): Promise<void> {
        // Validate input
        const validAmount = ValidationService.validateAmount(data.amount);

        if (!data.categoryId) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category ID is required"]);
        }

        // Check if category exists
        const category = await this.categoryRepository.findById(data.categoryId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Create new budget
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : new Date();
        
        await BudgetModel.create({
            user_id: userId,
            category_id: data.categoryId,
            amount: validAmount,
            start_date: startDate,
            end_date: endDate
        });
    }

    /**
     * Get budget list with spending information for a user
     */
    async getBudgetListWithSpending(userId: number): Promise<{
        total_budget: number;
        spent_amount: number;
        remaining_amount: number;
        budget_list: Array<BudgetWithCategory & {
            current_amount: number;
            remaining_amount: number;
            utilization_percentage: number;
        }>;
    }> {
        // Get user data
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Get budgets with categories and spending
        const budgets = await this.budgetRepository.findAllByUserWithCategoryAndSpending(userId);

        // Get total expense
        const total_expense = await this.expenseRepository.getTotalExpensesByUserId(userId);

        return {
            total_budget: Number(user.monthly_budget) || 0,
            spent_amount: total_expense,
            remaining_amount: Number(user.monthly_budget) > total_expense ? Number(user.monthly_budget) - total_expense : 0,
            budget_list: budgets
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
        // Validate input
        if (data.amount) {
            data.amount = ValidationService.validateAmount(data.amount);
        }

        // Update budget
        const budget = await this.budgetRepository.updateBudget(budgetId, userId, data);
        if (!budget) {
            throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Budget not found"]);
        }

        return budget;
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
        return budget;
    }
}