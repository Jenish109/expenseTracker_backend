import { BaseRepository } from './base.repository';
import ExpenseModel from '../models/expense.model';
import CategoryModel from '../models/category.model';
import type { CreateExpenseDTO, UpdateExpenseDTO } from '../interfaces/expense.interface';
import { Op, WhereOptions, Order, FindOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { handleDatabaseError } from '../utils/errorHandler';

export class ExpenseRepository extends BaseRepository<ExpenseModel> {
    constructor() {
        super(ExpenseModel);
    }

    /**
     * Find all expenses for a user with pagination
     */
    async findAllByUserIdPaginated(
        userId: number,
        page: number = 1,
        limit: number = 10,
        searchQuery?: string,
        categoryId?: number
    ) {
        const whereClause: WhereOptions<ExpenseModel> = {
            user_id: userId
        };

        // Add search by expense_name if searchQuery is provided
        if (searchQuery) {
            whereClause.expense_name = {
                [Op.like]: `%${searchQuery}%`
            };
        }

        // Add category filter if categoryId is provided
        if (categoryId) {
            whereClause.category_id = categoryId;
        }

        const options: FindOptions<ExpenseModel> = {
            where: whereClause,
            include: [{
                model: CategoryModel,
                as: 'category',
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at', 'updated_at']
            }],
            order: [['created_at', 'DESC']] as Order,
            offset: (page - 1) * limit,
            limit: limit
        };

        const { count, rows } = await ExpenseModel.findAndCountAll(options);

        return {
            data: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Find all expenses for a user
     */
    async findAllByUserId(userId: number) {
        const options: FindOptions<ExpenseModel> = {
            where: { user_id: userId } as WhereOptions<ExpenseModel>,
            include: [{
                model: CategoryModel,
                as: 'category',
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at', 'updated_at']
            }],
            order: [['expense_date', 'DESC']] as Order
        };

        return ExpenseModel.findAll(options);
    }

    /**
     * Get total expenses for a user
     */
    async getTotalExpensesByUserId(userId: number): Promise<number> {
        const result = await ExpenseModel.sum('amount', {
            where: { user_id: userId } as WhereOptions<ExpenseModel>
        });
        return Number(result) || 0;
    }

    /**
     * Get total expenses by category for a user
     */
    async getTotalExpensesByCategory(userId: number, categoryId: number): Promise<number> {
        const result = await ExpenseModel.sum('amount', {
            where: {
                user_id: userId,
                category_id: categoryId
            } as WhereOptions<ExpenseModel>
        });
        return Number(result) || 0;
    }

    /**
     * Get total expenses by category for current month
     */
    async getCurrentMonthExpensesByCategory(userId: number, categoryId: number): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const result = await ExpenseModel.sum('amount', {
            where: {
                user_id: userId,
                category_id: categoryId,
                expense_date: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            } as WhereOptions<ExpenseModel>
        });
        return Number(result) || 0;
    }

    /**
     * Get expenses by category for a user
     */
    async getExpensesByCategory(userId: number, categoryId: number) {
        const options: FindOptions<ExpenseModel> = {
            where: {
                user_id: userId,
                category_id: categoryId
            } as WhereOptions<ExpenseModel>,
            include: [{
                model: CategoryModel,
                as: 'category',
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at', 'updated_at']
            }],
            order: [['expense_date', 'DESC']] as Order
        };

        return ExpenseModel.findAll(options);
    }

    /**
     * Find expense by ID and user ID
     */
    async findByIdAndUserId(expenseId: number, userId: number) {
        const options: FindOptions<ExpenseModel> = {
            where: {
                expense_id: expenseId,
                user_id: userId
            } as WhereOptions<ExpenseModel>,
            include: [{
                model: CategoryModel,
                as: 'category',
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at', 'updated_at']
            }]
        };

        return ExpenseModel.findOne(options);
    }

    /**
     * Create a new expense
     */
    async create(data: CreateExpenseDTO & { user_id: number }) {
        return ExpenseModel.create({
            user_id: data.user_id,
            category_id: data.category_id,
            expense_name: data.expense_name,
            description: data.description,
            amount: data.amount,
            expense_date: data.expense_date || new Date()
        });
    }

    /**
     * Update an expense
     */
    override async update(data: Partial<ExpenseModel>, options: UpdateOptions<ExpenseModel>): Promise<number> {
        return super.update(data, options);
    }

    /**
     * Update an expense by ID
     */
    async updateById(expenseId: number, data: UpdateExpenseDTO) {
        const updateData: Partial<ExpenseModel> = {};

        if (data.category_id !== undefined) updateData.category_id = data.category_id;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.expense_date !== undefined) updateData.expense_date = data.expense_date;

        await this.update(updateData, {
            where: { expense_id: expenseId } as WhereOptions<ExpenseModel>
        });

        return this.findByIdAndUserId(expenseId, updateData.user_id!);
    }

    /**
     * Delete an expense
     */
    override async delete(options: DestroyOptions<ExpenseModel>): Promise<number> {
        return super.delete(options);
    }

    /**
     * Delete an expense by ID
     */
    async deleteById(expenseId: number): Promise<void> {
        await this.delete({
            where: { expense_id: expenseId } as WhereOptions<ExpenseModel>
        });
    }

    /**
     * Get expenses by date range for a user
     */
    async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date) {
        const options: FindOptions<ExpenseModel> = {
            where: {
                user_id: userId,
                expense_date: {
                    [Op.between]: [startDate, endDate]
                }
            } as WhereOptions<ExpenseModel>,
            include: [{
                model: CategoryModel,
                as: 'category'
            }],
            order: [['expense_date', 'DESC']] as Order
        };

        return ExpenseModel.findAll(options);
    }

    /**
     * Get expense summary by category for a user
     */
    async getExpenseSummaryByCategory(userId: number, startDate?: Date, endDate?: Date) {
        const where: WhereOptions<ExpenseModel> = { user_id: userId };

        if (startDate && endDate) {
            where.expense_date = {
                [Op.between]: [startDate, endDate]
            };
        }

        const options: FindOptions<ExpenseModel> = {
            where,
            include: [{
                model: CategoryModel,
                as: 'category',
                required: true,
                attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at', 'updated_at']
            }],
            attributes: [
                'category_id',
                [ExpenseModel.sequelize!.fn('SUM', ExpenseModel.sequelize!.col('amount')), 'total_amount'],
                [ExpenseModel.sequelize!.fn('COUNT', ExpenseModel.sequelize!.col('expense_id')), 'expense_count']
            ],
            group: ['category_id', 'category.category_id', 'category.category_name', 'category.category_color', 'category.user_id', 'category.is_default', 'category.created_at']
        };

        return ExpenseModel.findAll(options);
    }

    /**
     * Get expense trends
     */
    async getExpenseTrends(userId: number, period: 'daily' | 'weekly' | 'monthly', limit: number) {
        const dateFormat = period === 'daily' ? '%Y-%m-%d' :
            period === 'weekly' ? '%Y-%u' : '%Y-%m';

        const options: FindOptions<ExpenseModel> = {
            where: { user_id: userId },
            attributes: [
                [ExpenseModel.sequelize!.fn('DATE_FORMAT', ExpenseModel.sequelize!.col('expense_date'), dateFormat), 'period'],
                [ExpenseModel.sequelize!.fn('SUM', ExpenseModel.sequelize!.col('amount')), 'total_amount'],
                [ExpenseModel.sequelize!.fn('COUNT', ExpenseModel.sequelize!.col('expense_id')), 'expense_count']
            ],
            group: [ExpenseModel.sequelize!.fn('DATE_FORMAT', ExpenseModel.sequelize!.col('expense_date'), dateFormat)],
            order: [[ExpenseModel.sequelize!.fn('DATE_FORMAT', ExpenseModel.sequelize!.col('expense_date'), dateFormat), 'DESC']],
            limit
        };

        return ExpenseModel.findAll(options);
    }

    /**
     * Delete all expenses by user ID
     */
    async deleteByUserId(userId: number): Promise<void> {
        try {
            await this.delete({
                where: { user_id: userId } as WhereOptions<ExpenseModel>
            });
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    /**
     * Find expense by category and month
     */
    async findByCategoryAndMonth(userId: number, categoryId: number, month: number, year: number): Promise<ExpenseModel | null> {
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