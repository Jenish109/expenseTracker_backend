import { Expense, Category, User } from "../models";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { handleServiceError } from "../utils/errorHandler";
import type { CreateExpenseDTO, UpdateExpenseDTO, ExpenseWithCategory } from "../interfaces/expense.interface";
import { Op } from "sequelize";
import { ExpenseRepository } from '../repositories/expense.repository';
import { CategoryRepository } from '../repositories/category.repository';
import logger from '../utils/logger';
import { UserRepository } from '../repositories/user.repository';

interface ExpenseFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
}

export class ExpenseService {
    constructor(
        private expenseRepository: ExpenseRepository,
        private categoryRepository: CategoryRepository,
        private userRepository: UserRepository // Inject UserRepository
    ) { }

    /**
     * Helper to check if adding/updating an expense would exceed the user's monthly income
     */
    private async checkMonthlyIncomeLimit(userId: number, amount: number, expenseDate: Date, excludeExpenseId?: number) {
        // Get user and monthly_income
        const user = await this.userRepository.findById(userId);
        if (!user || user.monthly_income == null) {
            throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ['User or monthly income not found']);
        }
        const monthlyIncome = Number(user.monthly_income);

        // Use expense_date to determine the month and year
        const firstDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
        const lastDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0, 23, 59, 59, 999);

        // Get all expenses for this user in this month
        const expensesThisMonth = await this.expenseRepository.getExpensesByDateRange(userId, firstDay, lastDay);
        const totalThisMonth = expensesThisMonth
            .filter(exp => !excludeExpenseId || exp.expense_id !== excludeExpenseId)
            .reduce((sum, exp) => sum + Number(exp.amount), 0);

        // Check if adding/updating this expense exceeds monthly income
        if (totalThisMonth + Number(amount) > monthlyIncome) {
            throw new CustomError(
                ERROR_CODES.EXPENSE.LIMIT_EXCEEDED,
                [excludeExpenseId ? 'Updating this expense exceeds your monthly income for the month.' : 'Adding this expense exceeds your monthly income for the month.']
            );
        }
    }

    /**
     * Create a new expense
     */
    async createExpense(userId: number, data: CreateExpenseDTO): Promise<ExpenseWithCategory> {
        try {
            // Validate category exists
            const category = await this.categoryRepository.findById(data.category_id);
            if (!category) {
                throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ['Invalid category']);
            }

            // Set default expense date if not provided
            if (!data.expense_date) {
                data.expense_date = new Date();
            }

            // Monthly income check
            await this.checkMonthlyIncomeLimit(userId, Number(data.amount), new Date(data.expense_date));

            // Create expense
            const expense = await this.expenseRepository.create({
                user_id: userId,
                category_id: data.category_id,
                amount: data.amount,
                expense_name: data.expense_name,
                description: data.description,
                expense_date: data.expense_date
            });

            logger.debug('Created expense', { expenseId: expense.expense_id });

            // Get expense with category details
            const expenseWithCategory = await this.expenseRepository.findByIdAndUserId(expense.expense_id, userId);
            if (!expenseWithCategory) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ['Created expense not found']);
            }

            return expenseWithCategory as ExpenseWithCategory;
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Get expense list for a user with optional filters
     */
    async getExpenseList(
        userId: number,
        filters?: {
            startDate?: string;
            endDate?: string;
            categoryId?: number;
            searchQuery?: string;
            page?: number;
            limit?: number;
        }
    ): Promise<{
        data: ExpenseWithCategory[];
        total: number;
        total_amount: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            // Use repository's paginated method with search and filter
            const result = await this.expenseRepository.findAllByUserIdPaginated(
                userId,
                filters?.page,
                filters?.limit,
                filters?.searchQuery,
                filters?.categoryId
            );

            // Filter by date range if provided
            let filteredData = result.data;
            if (filters?.startDate && filters?.endDate) {
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                filteredData = filteredData.filter(exp => {
                    const expDate = new Date(exp.expense_date);
                    return expDate >= start && expDate <= end;
                });
            }

            const total_amount = filteredData.reduce((sum, exp) => sum + Number(exp.amount), 0);

            return {
                data: filteredData as ExpenseWithCategory[],
                total: result.total,
                total_amount,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            };
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Get expense summary by category
     */
    async getExpenseSummaryByCategory(
        userId: number,
        startDate?: string,
        endDate?: string
    ): Promise<Array<{
        category_id: number;
        category_name: string;
        category_color: string;
        total_amount: number;
        expense_count: number;
        percentage: number;
    }>> {
        const where: any = { user_id: userId };

        // Apply date filters if provided
        if (startDate && endDate) {
            where.expense_date = {
                [Op.between]: [startDate, endDate]
            };
        }

        // Get expenses grouped by category
        const expenses = await Expense.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                required: true
            }],
            attributes: [
                'category_id',
                [Expense.sequelize!.fn('SUM', Expense.sequelize!.col('amount')), 'total_amount'],
                [Expense.sequelize!.fn('COUNT', Expense.sequelize!.col('expense_id')), 'expense_count']
            ],
            group: ['category_id', 'category.category_id', 'category.category_name', 'category.category_color', 'category.user_id', 'category.is_default', 'category.created_at']
        });

        // Calculate total amount for percentage calculation
        const totalAmount = expenses.reduce((sum, expense) => {
            return sum + Number(expense.getDataValue('total_amount'));
        }, 0);

        // Map to response format
        return expenses.map(expense => {
            const category = expense.getCategory();
            const amount = Number(expense.getDataValue('total_amount'));
            return {
                category_id: category.category_id,
                category_name: category.category_name,
                category_color: category.category_color,
                user_id: category.user_id!,
                is_default: category.is_default,
                total_amount: amount,
                expense_count: Number(expense.getDataValue('expense_count')),
                percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
            };
        });
    }

    /**
     * Get expense by ID
     */
    async getExpenseById(expenseId: number, userId: number): Promise<ExpenseWithCategory> {
        try {
            const expense = await this.expenseRepository.findByIdAndUserId(expenseId, userId);

            if (!expense) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ['Expense not found']);
            }

            // Check ownership
            if (expense.user_id !== userId) {
                throw new CustomError(ERROR_CODES.EXPENSE.UNAUTHORIZED, ['Not authorized to access this expense']);
            }

            return expense as ExpenseWithCategory;
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Update expense
     */
    async updateExpense(expenseId: number, userId: number, data: UpdateExpenseDTO): Promise<ExpenseWithCategory> {
        try {
            // Check expense exists and user owns it
            const expense = await this.getExpenseById(expenseId, userId);

            // Validate category if being updated
            if (data.category_id && data.category_id !== expense.category_id) {
                const category = await this.categoryRepository.findById(data.category_id);
                if (!category) {
                    throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ['Invalid category']);
                }
            }

            // Validate amount if being updated
            const newAmount = data.amount !== undefined ? data.amount : expense.amount;
            if (newAmount <= 0) {
                throw new CustomError(ERROR_CODES.EXPENSE.INVALID_AMOUNT, ['Amount must be greater than 0']);
            }

            // Monthly income check for update
            const expenseDate = data.expense_date ? new Date(data.expense_date) : new Date(expense.expense_date);
            await this.checkMonthlyIncomeLimit(userId, Number(newAmount), expenseDate, expenseId);

            // Update expense
            await this.expenseRepository.update(data, { where: { expense_id: expenseId, user_id: userId } });
            const expenseWithCategory = await this.expenseRepository.findByIdAndUserId(expenseId, userId);
            if (!expenseWithCategory) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ['Expense not found after update']);
            }

            return expenseWithCategory as ExpenseWithCategory;
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Delete expense
     */
    async deleteExpense(expenseId: number, userId: number): Promise<void> {
        try {
            // Check expense exists and user owns it
            await this.getExpenseById(expenseId, userId);

            // Delete expense
            await this.expenseRepository.delete({ where: { expense_id: expenseId, user_id: userId } });
            logger.debug('Deleted expense', { expenseId });
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Get expense trends
     */
    async getExpenseTrends(
        userId: number,
        period: 'daily' | 'weekly' | 'monthly' = 'monthly',
        limit: number = 12
    ): Promise<Array<{
        period: string;
        total_amount: number;
        expense_count: number;
    }>> {
        const dateFormat = period === 'daily' ? '%Y-%m-%d' :
            period === 'weekly' ? '%Y-%u' : '%Y-%m';

        const expenses = await Expense.findAll({
            where: { user_id: userId },
            attributes: [
                [Expense.sequelize!.fn('DATE_FORMAT', Expense.sequelize!.col('expense_date'), dateFormat), 'period'],
                [Expense.sequelize!.fn('SUM', Expense.sequelize!.col('amount')), 'total_amount'],
                [Expense.sequelize!.fn('COUNT', Expense.sequelize!.col('expense_id')), 'expense_count']
            ],
            group: [Expense.sequelize!.fn('DATE_FORMAT', Expense.sequelize!.col('expense_date'), dateFormat)],
            order: [[Expense.sequelize!.fn('DATE_FORMAT', Expense.sequelize!.col('expense_date'), dateFormat), 'DESC']],
            limit
        });

        return expenses.map(expense => ({
            period: expense.getDataValue('period'),
            total_amount: Number(expense.getDataValue('total_amount')),
            expense_count: Number(expense.getDataValue('expense_count'))
        }));
    }

    /**
     * List expenses with filters
     */
    async listExpenses(userId: number, filters: ExpenseFilters): Promise<{
        data: ExpenseWithCategory[];
        total: number;
        total_amount: number;
    }> {
        try {
            // Validate date filters
            if (filters.startDate && !this.isValidDate(filters.startDate)) {
                throw new CustomError(ERROR_CODES.EXPENSE.DATE_INVALID, ['Invalid start date']);
            }
            if (filters.endDate && !this.isValidDate(filters.endDate)) {
                throw new CustomError(ERROR_CODES.EXPENSE.DATE_INVALID, ['Invalid end date']);
            }

            // Validate category if filtered
            if (filters.categoryId) {
                const category = await this.categoryRepository.findById(Number(filters.categoryId));
                if (!category) {
                    throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ['Invalid category filter']);
                }
            }

            // Get expenses
            const result = await this.expenseRepository.findAll({ where: { user_id: userId } });
            const total = result.length;
            const total_amount = result.reduce((sum, exp) => sum + Number(exp.amount), 0);
            return { data: result as ExpenseWithCategory[], total, total_amount };
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Get expense statistics
     */
    async getExpenseStats(userId: number, filters: Pick<ExpenseFilters, 'startDate' | 'endDate' | 'categoryId'>): Promise<{
        total_amount: number;
        average_amount: number;
        count: number;
        by_category: Array<{
            category_id: string;
            category_name: string;
            total_amount: number;
            count: number;
        }>;
    }> {
        try {
            // Validate date filters
            if (filters.startDate && !this.isValidDate(filters.startDate)) {
                throw new CustomError(ERROR_CODES.EXPENSE.DATE_INVALID, ['Invalid start date']);
            }
            if (filters.endDate && !this.isValidDate(filters.endDate)) {
                throw new CustomError(ERROR_CODES.EXPENSE.DATE_INVALID, ['Invalid end date']);
            }

            // Validate category if filtered
            if (filters.categoryId) {
                const category = await this.categoryRepository.findById(Number(filters.categoryId));
                if (!category) {
                    throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ['Invalid category filter']);
                }
            }

            // Get statistics
            // const stats = await this.expenseRepository.getStatistics({
            //     ...filters,
            //     user_id: userId
            // });

            // For now, return a placeholder or calculate directly if getStatistics is removed
            // This part of the logic needs to be re-evaluated if getStatistics is truly removed
            // For now, returning a dummy structure as getStatistics is not defined in the original file
            return {
                total_amount: 0, // Placeholder
                average_amount: 0, // Placeholder
                count: 0, // Placeholder
                by_category: [] // Placeholder
            };
        } catch (error) {
            throw handleServiceError(error);
        }
    }

    /**
     * Validate date string format
     */
    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
} 