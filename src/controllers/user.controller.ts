import { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { DashboardData } from "../interfaces/dashboard.interface";
import { UserRepository } from "../repositories/user.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { Pool } from "mysql2/promise";
import BudgetModel from '../models/budget.model';

export class UserController {
    private userRepository: UserRepository;
    private expenseRepository: ExpenseRepository;
    private categoryRepository: CategoryRepository;
    private budgetRepository: BudgetRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.expenseRepository = new ExpenseRepository();
        this.categoryRepository = new CategoryRepository();
        this.budgetRepository = new BudgetRepository(BudgetModel);
    }

    /**
     * Add monthly budget and income data
     */
    async addMonthlyData(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const { monthly_budget, monthly_income } = req.body || {};

            if (!monthly_budget && !monthly_income) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, ["Monthly budget or income is required"]);
            }
            else if (!monthly_budget) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, ["Monthly budget is required"]);
            } else if (!monthly_income) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, ["Monthly income is required"]);
            }

            await this.userRepository.updateMonthlyData(userId, monthly_budget, monthly_income);

            logger.logPerformance('Update Monthly Data', startTime);
            logger.info('Monthly data updated successfully', { userId });

            res.status(200).json({
                success: true,
                message: "Monthly data updated successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get dashboard data
     */
    async getDashboardData(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            let total_expense = 0;

            let dashboard_data: DashboardData = {
                user_id: userId,
                monthly_budget: null,
                monthly_income: null,
                monthly_expense: 0,
                monthly_savings: null,
                budget_utilization: 0,
                recent_transactions: [],
                budget_data: [],
                spending_overview: {
                    monthly_spending: [
                        { month: 'Jan', amount: 0 },
                        { month: 'Feb', amount: 0 },
                        { month: 'Mar', amount: 0 },
                        { month: 'Apr', amount: 0 },
                        { month: 'May', amount: 0 },
                        { month: 'Jun', amount: 0 },
                        { month: 'Jul', amount: 0 },
                        { month: 'Aug', amount: 0 },
                        { month: 'Sep', amount: 0 },
                        { month: 'Oct', amount: 0 },
                        { month: 'Nov', amount: 0 },
                        { month: 'Dec', amount: 0 },
                    ],
                    category_spending: []
                }
            }

            // Get user data
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }

            // Get recent transactions with category info
            const expenses = await this.expenseRepository.findAllByUserId(userId);
            const recentExpenses = expenses.slice(0, 5);

            // Get budgets with category info
            const budgets = await this.budgetRepository.findAllByUserWithCategoryAndSpending(userId);

            // Get all categories
            const categories = await this.categoryRepository.findAll();

            // Calculate total expense
            total_expense = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);

            // Process budget data
            const updated_budget_list = budgets
                .filter((budget: any) => budget.category && budget.category.category_id !== undefined)
                .map((budget: any) => ({
                    budget_id: budget.budget_id,
                    category: {
                        category_id: budget.category.category_id,
                        category_name: budget.category.category_name,
                        category_color: budget.category.category_color,
                        created_at: budget.category.created_at
                    },
                    current_amount: budget.current_amount,
                    amount: budget.amount,
                    remaining_amount: Math.max(0, budget.amount - budget.current_amount),
                    utilization_percentage: budget.amount > 0 ? (budget.current_amount / budget.amount) * 100 : 0,
                    created_at: budget.created_at,
                }));

            // Process category spending
            const categorySpending = categories.map((category: any) => {
                const current_amount = expenses
                    .filter((expense: any) => expense.category_id === category.category_id)
                    .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);

                return {
                    category: {
                        category_id: category.category_id,
                        category_name: category.category_name,
                        category_color: category.category_color,
                        created_at: category.created_at
                    },
                    amount: current_amount,
                    percentage: total_expense > 0 ? (current_amount / total_expense) * 100 : 0,
                };
            });

            // Process monthly spending
            expenses.forEach((expense: any) => {
                const date = new Date(expense.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                const amount = Number(expense.amount);
                const existingMonth = dashboard_data.spending_overview.monthly_spending.find(
                    spending => spending.month === month
                );
                if (existingMonth) {
                    existingMonth.amount += amount;
                }
            });

            // Format recent transactions
            const recent_transactions = recentExpenses.map((expense: any) => ({
                expense_id: expense.expense_id,
                user_id: expense.user_id,
                category_id: expense.category_id,
                expense_name: expense.expense_name,
                amount: expense.amount,
                date: expense.date,
                created_at: expense.created_at,
                category: {
                    category_id: expense.category.category_id,
                    category_name: expense.category.category_name,
                    category_color: expense.category.category_color,
                    created_at: expense.category.created_at
                }
            }));

            // Calculate final dashboard data
            const monthly_budget = Number(user.monthly_budget);
            const monthly_income = Number(user.monthly_income);
            const savings = (monthly_income > monthly_budget) ? (monthly_income - monthly_budget) : 0;
            const budgetUtilization = monthly_budget > 0 ? (total_expense / monthly_budget) * 100 : 0;

            dashboard_data.monthly_budget = monthly_budget;
            dashboard_data.monthly_income = monthly_income;
            dashboard_data.monthly_expense = total_expense;
            dashboard_data.monthly_savings = savings;
            dashboard_data.budget_utilization = budgetUtilization;
            dashboard_data.recent_transactions = recent_transactions;
            dashboard_data.budget_data = updated_budget_list;
            dashboard_data.spending_overview.category_spending = categorySpending;

            logger.logPerformance('Get Dashboard Data', startTime);
            logger.info('Dashboard data retrieved successfully', { userId });

            res.status(200).json({
                success: true,
                data: dashboard_data,
                message: "Dashboard data retrieved successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }
}