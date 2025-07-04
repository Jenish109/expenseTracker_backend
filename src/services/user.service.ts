import { User, Expense, Budget, Category } from "../models";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { Op } from "sequelize";
import { DashboardData } from "../interfaces/dashboard.interface";

export class UserService {
    /**
     * Update user's monthly budget and income
     */
    async updateMonthlyData(userId: number, monthlyBudget: number, monthlyIncome: number): Promise<void> {
        const user = await User.findByPk(userId);
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
        const user = await User.findByPk(userId);
        if (!user) {
            throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }

        // Get recent expenses
        const recentExpenses = await Expense.findAll({
            where: { user_id: userId },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'category_color']
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
                attributes: ['category_id', 'category_name', 'category_color']
            }]
        });

        // Get budget data
        const budgets = await Budget.findAll({
            where: { user_id: userId },
            include: [{
                model: Category,
                attributes: ['category_id', 'category_name', 'category_color']
            }]
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
            const categoryExpenses = monthlyExpenses.filter(
                expense => expense.category_id === budget.category_id
            );
            const currentAmount = categoryExpenses.reduce(
                (sum, expense) => sum + Number(expense.amount),
                0
            );

            return {
                budget_id: budget.budget_id,
                category: budget.category,
                amount: Number(budget.amount),
                current_amount: currentAmount,
                remaining_amount: Math.max(0, Number(budget.amount) - currentAmount),
                utilization_percentage: (currentAmount / Number(budget.amount)) * 100
            };
        });

        // Calculate category-wise spending
        const categorySpending = monthlyExpenses.reduce((acc, expense) => {
            const categoryId = expense.category_id;
            if (!acc[categoryId]) {
                acc[categoryId] = {
                    category: expense.category,
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
            recent_transactions: recentExpenses,
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
        const user = await User.findByPk(userId);
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

            const existingUser = await User.findOne({
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
}
