import { User, Expense, Budget, Category } from "../models";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { Op } from "sequelize";
import { DashboardData } from "../interfaces/dashboard.interface";
import { UserRepository } from "../repositories/user.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { CategoryRepository } from "../repositories/category.repository";
import BudgetModel from "../models/budget.model";

export class UserService {
    private userRepository: UserRepository;
    private expenseRepository: ExpenseRepository;
    private budgetRepository: BudgetRepository;
    private categoryRepository: CategoryRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.expenseRepository = new ExpenseRepository();
        this.budgetRepository = new BudgetRepository(BudgetModel);
        this.categoryRepository = new CategoryRepository();
    }
    /**
     * Update user's monthly budget and income
     */
    async updateMonthlyData(userId: number, monthlyBudget: number, monthlyIncome: number): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        await user.update({
            monthly_budget: monthlyBudget,
            monthly_income: monthlyIncome
        });
    }

    /**
     * Get user's dashboard data including expenses, budgets, and analytics
     */
    async getDashboardData(userId: number): Promise<DashboardData> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Get recent expenses
        const recentExpenses = await Expense.findAll({
            where: { user_id: userId },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
                required: true
            }],
            order: [['expense_date', 'DESC']],
            limit: 5
        });

        // Get all expenses for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthlyExpenses = await Expense.findAll({
            where: {
                user_id: userId,
                expense_date: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
                required: true
            }]
        });

        // Get budget data
        const budgets = await Budget.findAll({
            where: { user_id: userId },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
                required: true
            }]
        });

        // Get all categories
        const categories = await Category.findAll({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            order: [['category_name', 'ASC']]
        });

        // Calculate total monthly expense
        const totalMonthlyExpense = monthlyExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
        );

        // Calculate budget utilization
        const budgetUtilization = user.monthly_budget 
            ? (totalMonthlyExpense / Number(user.monthly_budget)) * 100 
            : 0;

        // Calculate monthly savings
        const monthlySavings = Number(user.monthly_income) > Number(user.monthly_budget)
            ? Number(user.monthly_income) - Number(user.monthly_budget)
            : 0;

        // Process budget data with current spending
        const budgetData = budgets.map(budget => {
            if (!budget.category) {
                throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found for budget"]);
            }

            const categoryExpenses = monthlyExpenses.filter(
                expense => expense.category_id === budget.category_id
            );
            const currentAmount = categoryExpenses.reduce(
                (sum, expense) => sum + Number(expense.amount),
                0
            );

            return {
                budget_id: budget.budget_id,
                category: {
                    category_id: budget.category.category_id,
                    category_name: budget.category.category_name,
                    category_color: budget.category.category_color,
                    user_id: budget.category.user_id!,
                    is_default: budget.category.is_default,
                    created_at: budget.category.created_at
                },
                amount: Number(budget.amount),
                current_amount: currentAmount,
                remaining_amount: Math.max(0, Number(budget.amount) - currentAmount),
                utilization_percentage: (currentAmount / Number(budget.amount)) * 100
            };
        });

        // Calculate category-wise spending
        const categorySpending = monthlyExpenses.reduce((acc, expense) => {
            const categoryId = expense.category_id;
            if (!expense.category) {
                throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found for expense"]);
            }

            if (!acc[categoryId]) {
                acc[categoryId] = {
                    category: {
                        category_id: expense.category.category_id,
                        category_name: expense.category.category_name,
                        category_color: expense.category.category_color,
                        user_id: expense.category.user_id!,
                        is_default: expense.category.is_default,
                        created_at: expense.category.created_at
                    },
                    amount: 0,
                    percentage: 0
                };
            }
            acc[categoryId].amount += Number(expense.amount);
            return acc;
        }, {} as Record<number, any>);

        // Calculate percentage for each category
        Object.values(categorySpending).forEach(category => {
            category.percentage = totalMonthlyExpense 
                ? (category.amount / totalMonthlyExpense) * 100 
                : 0;
        });

        // Get monthly spending for the last 12 months
        const last12Months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date.toLocaleString('default', { month: 'short' });
        }).reverse();

        const monthlySpending = last12Months.map(month => ({
            month,
            amount: 0
        }));

        // Fill in the actual spending data
        monthlyExpenses.forEach(expense => {
            const month = new Date(expense.expense_date)
                .toLocaleString('default', { month: 'short' });
            const monthData = monthlySpending.find(m => m.month === month);
            if (monthData) {
                monthData.amount += Number(expense.amount);
            }
        });

        return {
            user_id: userId,
            monthly_budget: Number(user.monthly_budget),
            monthly_income: Number(user.monthly_income),
            monthly_expense: totalMonthlyExpense,
            monthly_savings: monthlySavings,
            budget_utilization: budgetUtilization,
            recent_transactions: recentExpenses.map(expense => {
                if (!expense.category) {
                    throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found for expense"]);
                }
                return {
                    expense_id: expense.expense_id,
                    user_id: expense.user_id,
                    category_id: expense.category_id,
                    expense_name: expense.expense_name,
                    amount: expense.amount,
                    date: expense.expense_date,
                    created_at: expense.created_at,
                    category: {
                        category_id: expense.category.category_id,
                        category_name: expense.category.category_name,
                        category_color: expense.category.category_color,
                        user_id: expense.category.user_id!,
                        is_default: expense.category.is_default,
                        created_at: expense.category.created_at
                    }
                };
            }),
            budget_data: budgetData,
            spending_overview: {
                monthly_spending: monthlySpending,
                category_spending: Object.values(categorySpending)
            }
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: number, data: { username?: string; email?: string }): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Check if email/username is already taken
        if (data.email || data.username) {
            const whereClause: any = {
                user_id: { [Op.ne]: userId }
            };
            
            if (data.email) {
                whereClause.email = data.email;
            }
            if (data.username) {
                whereClause.username = data.username;
            }

            const existingUser = await this.userRepository.findOne({
                where: whereClause
            });

            if (existingUser) {
                if (data.email && existingUser.email === data.email) {
                    throw new CustomError(ERROR_CODES.USER.ALREADY_EXISTS, ["Email already exists"]);
                }
                if (data.username && existingUser.username === data.username) {
                    throw new CustomError(ERROR_CODES.USER.ALREADY_EXISTS, ["Username already exists"]);
                }
            }
        }

        await user.update(data);
    }

    /**
     * Delete user account and all related data
     */
    async deleteAccount(userId: number): Promise<void> {
        await this.expenseRepository.deleteByUserId(userId);
        await this.budgetRepository.deleteByUserId(userId);
        // await this.categoryRepository.deleteByUserId(userId);
        const deleted = await this.userRepository.deleteById(userId);
        if (!deleted) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }
    }
}
