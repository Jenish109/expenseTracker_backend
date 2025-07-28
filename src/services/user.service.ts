import { User, Expense, Budget, Category } from "../models";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { Op } from "sequelize";
import { DashboardData } from "../interfaces/dashboard.interface";
import { BudgetData } from "../interfaces/user.interface";
import { UserRepository } from "../repositories/user.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { CategoryRepository } from "../repositories/category.repository";
import BudgetModel from "../models/budget.model";
import { UserMonthlyFinanceRepository } from "../repositories/userMonthlyFinance.repository";
import UserMonthlyFinance from "../models/userMonthlyFinance.model";

export class UserService {
    private userRepository: UserRepository;
    private expenseRepository: ExpenseRepository;
    private budgetRepository: BudgetRepository;
    private categoryRepository: CategoryRepository;
    private userMonthlyFinanceRepository: UserMonthlyFinanceRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.expenseRepository = new ExpenseRepository();
        this.budgetRepository = new BudgetRepository(BudgetModel);
        this.categoryRepository = new CategoryRepository();
        this.userMonthlyFinanceRepository = new UserMonthlyFinanceRepository();
    }

    /**
     * Set or update a user's monthly finance (budget/income) for a given period
     */
    async setOrUpdateMonthlyFinance(userId: number, period: Date, data: { monthly_budget?: number; monthly_income?: number }) {
        return this.userMonthlyFinanceRepository.createOrUpdateByUserAndPeriod(userId, period, data);
    }

    /**
     * Get a user's monthly finance for a given period
     */
    async getMonthlyFinance(userId: number, period: Date) {
        return this.userMonthlyFinanceRepository.findByUserAndPeriod(userId, period);
    }

    /**
     * Get all monthly finances for a user
     */
    async getAllMonthlyFinances(userId: number) {
        return this.userMonthlyFinanceRepository.findAllByUser(userId);
    }

    /**
     * Ensure current month's finance exists; if not, copy from last month
     */
    async ensureCurrentMonthFinance(userId: number) {
        console.log('ensureCurrentMonthFinance called for user:', userId);
        try {
            const now = new Date();
            const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            console.log('Checking for current month period:', period.toISOString());
            let monthlyFinance = await this.userMonthlyFinanceRepository.findByUserAndPeriod(userId, period);
            if (monthlyFinance) {
                console.log('Current month entry exists:', monthlyFinance.id);
            }
            if (!monthlyFinance) {
                // Find the most recent previous month's finance
                const lastMonthFinance = await this.userMonthlyFinanceRepository.findMostRecentBeforePeriod(userId, period);
                console.log('Last month finance found:', lastMonthFinance ? lastMonthFinance.id : null);
                if (lastMonthFinance) {
                    monthlyFinance = await this.userMonthlyFinanceRepository.createOrUpdateByUserAndPeriod(userId, period, {
                        monthly_budget: lastMonthFinance.monthly_budget,
                        monthly_income: lastMonthFinance.monthly_income
                    });
                    console.log('Created new entry for current month:', monthlyFinance.id);
                } else {
                    console.log('No previous month finance found to copy.');
                }
            }
            return monthlyFinance;
        } catch (err) {
            console.error('Error in ensureCurrentMonthFinance:', err);
            throw err;
        }
    }

    /**
     * Get user's dashboard data including expenses, budgets, and analytics
     */
    async getDashboardData(userId: number): Promise<DashboardData> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Ensure current month's finance exists
        await this.ensureCurrentMonthFinance(userId);

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
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

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

        // Get monthly finance for the current month (UTC)
        const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const monthlyFinance = await this.userMonthlyFinanceRepository.findByUserAndPeriod(user.user_id, period);
        const monthlyBudget = monthlyFinance?.monthly_budget ?? 0;
        const monthlyIncome = monthlyFinance?.monthly_income ?? 0;

        if (!user || monthlyIncome == null) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Calculate budget utilization
        const budgetUtilization = monthlyIncome
            ? (totalMonthlyExpense / Number(monthlyIncome)) * 100
            : 0;

        // Calculate monthly savings
        const monthlySavings = Number(monthlyIncome) > Number(monthlyBudget)
            ? Number(monthlyIncome) - Number(monthlyBudget)
            : 0;

        // Process budget data with current spending
        const budgetData: BudgetData[] = budgets.map(budget => {
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
                current_month_spending: currentAmount,
                amount: Number(budget.amount),
                remaining_amount: Math.max(0, Number(budget.amount) - currentAmount),
                utilization_percentage: (currentAmount / Number(budget.amount)) * 100,
                created_at: budget.created_at
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
            monthly_budget: Number(monthlyBudget),
            monthly_income: Number(monthlyIncome),
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

    /**
     * Get user financial history: income, budget, total expenses, and total budget per month
     */
    async getUserHistory(userId: number) {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth() + 1;
        const monthlyFinances = (await this.userMonthlyFinanceRepository.findAllByUser(userId))
            .filter(finance => {
                const periodDate = new Date(finance.period);
                const year = periodDate.getUTCFullYear();
                const month = periodDate.getUTCMonth() + 1;
                return !(year === currentYear && month === currentMonth);
            });
        if (!monthlyFinances || monthlyFinances.length === 0) return [];

        // Get expense trends (grouped by month)
        const expenseTrends = await this.expenseRepository.getExpenseTrends(userId, 'monthly', 100);
        // Map: { 'YYYY-MM': total_expense }
        const expenseMap: Record<string, number> = {};
        for (const trend of expenseTrends) {
            // trend.period is 'YYYY-MM'
            const period = (trend as any).get('period');
            const totalAmount = Number((trend as any).get('total_amount'));
            expenseMap[period] = totalAmount;
        }

        // For each month, get total budget and aggregate
        const history = [];
        for (const finance of monthlyFinances) {
            const periodDate = new Date(finance.period);
            const year = periodDate.getUTCFullYear();
            const month = periodDate.getUTCMonth() + 1; // JS: 0-based
            const periodStr = `${year}-${month.toString().padStart(2, '0')}`;
            // Get total budget for this month
            const total_budget = await this.budgetRepository.getMonthlyBudgetSum(userId, month, year);
            history.push({
                month: periodStr,
                income: finance.monthly_income,
                budget: finance.monthly_budget,
                total_expense: expenseMap[periodStr] || 0,
                total_budget: total_budget || 0
            });
        }
        // Sort by month descending
        history.sort((a, b) => b.month.localeCompare(a.month));
        return history;
    }
}
