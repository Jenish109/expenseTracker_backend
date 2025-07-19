import { BaseRepository } from './base.repository';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import type { CreateCategoryDTO, ExpenseCategory } from '../interfaces/category.interface';
import CategoryModel from '../models/category.model';
import ExpenseModel from '../models/expense.model';
import BudgetModel from '../models/budget.model';
import { Op, DestroyOptions, UpdateOptions, WhereOptions } from 'sequelize';
import { CustomError } from '../utils/customError';
import { ERROR_CODES } from '../constants/errorCodes';
import { handleDatabaseError } from '../utils/errorHandler';

export class CategoryRepository extends BaseRepository<CategoryModel> {
    constructor() {
        super(CategoryModel);
    }

    /**
     * Create a new category
     */
    async createOne(categoryData: CreateCategoryDTO): Promise<CategoryModel> {
        return this.create({
            category_name: categoryData.categoryName,
            category_color: categoryData.categoryColor,
            user_id: categoryData.user_id,
            is_default: false
        });
    }

    /**
     * Find category by ID
     */
    override async findById(categoryId: number): Promise<CategoryModel | null> {
        return this.findOne({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            where: { category_id: categoryId }
        });
    }

    /**
     * Find category by name
     */
    async findByName(categoryName: string): Promise<CategoryModel | null> {
        return this.findOne({
            attributes: ['category_id', 'category_name', 'category_color', 'created_at'],
            where: { category_name: categoryName }
        });
    }

    /**
     * Get all categories
     */
    override async findAll(): Promise<CategoryModel[]> {
        return super.findAll({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            order: [['category_name', 'ASC']]
        });
    }

    /**
     * Update category
     */
    async updateOne(categoryId: number, updateData: Partial<CreateCategoryDTO>): Promise<CategoryModel | null> {
        // Transform the update data to match database column names
        const transformedData: any = {};

        if (updateData.categoryName !== undefined) {
            transformedData.category_name = updateData.categoryName;
        }
        if (updateData.categoryColor !== undefined) {
            transformedData.category_color = updateData.categoryColor;
        }

        const [updatedCount] = await CategoryModel.update(transformedData, {
            where: { category_id: categoryId }
        });

        return updatedCount > 0 ? this.findById(categoryId) : null;
    }

    /**
     * Delete category
     */
    async deleteOne(categoryId: number): Promise<void> {
        const canDelete = await this.canDeleteCategory(categoryId);
        if (!canDelete.canDelete) {
            throw new CustomError(ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION, ['Cannot delete category as it is being used']);
        }
        await this.delete({
            where: { category_id: categoryId }
        } as DestroyOptions<CategoryModel>);
    }

    /**
     * Check if category name exists
     */
    async nameExists(categoryName: string, excludeCategoryId?: number): Promise<boolean> {
        const where: any = { category_name: categoryName };
        if (excludeCategoryId) {
            where.category_id = { [Op.ne]: excludeCategoryId };
        }
        return this.exists(where);
    }

    /**
     * Get categories with usage statistics
     */
    async getCategoriesWithUsage(): Promise<Array<ExpenseCategory & {
        expense_count: number;
        budget_count: number;
        total_expenses: number;
        is_in_use: boolean;
    }>> {
        const categories = await CategoryModel.findAll({
            include: [
                {
                    model: ExpenseModel,
                    attributes: []
                },
                {
                    model: BudgetModel,
                    attributes: []
                }
            ],
            attributes: [
                'category_id',
                'category_name',
                'category_color',
                'created_at',
                [CategoryModel.sequelize!.fn('COUNT', CategoryModel.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [CategoryModel.sequelize!.fn('COUNT', CategoryModel.sequelize!.col('Budgets.budget_id')), 'budget_count'],
                [CategoryModel.sequelize!.fn('SUM', CategoryModel.sequelize!.col('Expenses.amount')), 'total_expenses']
            ],
            group: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
                user_id: data.user_id!,
                is_default: data.is_default,
                created_at: data.created_at,
                expense_count: Number(data.expense_count) || 0,
                budget_count: Number(data.budget_count) || 0,
                total_expenses: Number(data.total_expenses) || 0,
                is_in_use: (Number(data.expense_count) || 0) + (Number(data.budget_count) || 0) > 0
            };
        });
    }

    /**
     * Get unused categories (no expenses or budgets)
     */
    async getUnusedCategories(): Promise<ExpenseCategory[]> {
        const categories = await CategoryModel.findAll({
            include: [
                {
                    model: ExpenseModel,
                    attributes: [],
                    required: false
                },
                {
                    model: BudgetModel,
                    attributes: [],
                    required: false
                }
            ],
            where: {
                [Op.and]: [
                    CategoryModel.sequelize!.literal('Expenses.expense_id IS NULL'),
                    CategoryModel.sequelize!.literal('Budgets.budget_id IS NULL')
                ]
            },
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
                user_id: data.user_id!,
                is_default: data.is_default,
                created_at: data.created_at
            };
        });
    }



    /**
     * Get categories with expenses for a specific user
     */
    async getCategoriesWithExpensesForUser(userId: number): Promise<Array<ExpenseCategory & {
        expense_count: number;
        total_amount: number;
        latest_expense_date: Date;
    }>> {
        const categories = await CategoryModel.findAll({
            include: [{
                model: ExpenseModel,
                where: { user_id: userId },
                attributes: []
            }],
            attributes: [
                'category_id',
                'category_name',
                'category_color',
                'user_id',
                'is_default',
                'created_at',
                [CategoryModel.sequelize!.fn('COUNT', CategoryModel.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [CategoryModel.sequelize!.fn('SUM', CategoryModel.sequelize!.col('Expenses.amount')), 'total_amount'],
                [CategoryModel.sequelize!.fn('MAX', CategoryModel.sequelize!.col('Expenses.created_at')), 'latest_expense_date']
            ],
            group: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            order: [[CategoryModel.sequelize!.col('total_amount'), 'DESC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
                user_id: data.user_id!,
                is_default: data.is_default,
                created_at: data.created_at,
                expense_count: Number(data.expense_count) || 0,
                total_amount: Number(data.total_amount) || 0,
                latest_expense_date: data.latest_expense_date
            };
        });
    }

    /**
     * Get categories that have budgets for a specific user
     */
    async getCategoriesWithBudgetsForUser(userId: number): Promise<Array<ExpenseCategory & {
        budget_amount: number;
        budget_created_at: Date;
    }>> {
        const categories = await CategoryModel.findAll({
            include: [{
                model: BudgetModel,
                where: { user_id: userId },
                attributes: ['amount', 'created_at']
            }],
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            const budget = data.Budget || {};
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
                user_id: data.user_id!,
                is_default: data.is_default,
                created_at: data.created_at,
                budget_amount: Number(budget.amount) || 0,
                budget_created_at: budget.created_at
            };
        });
    }

    /**
     * Check if category can be safely deleted
     */
    async canDeleteCategory(categoryId: number): Promise<{
        canDelete: boolean;
        expenseCount: number;
        budgetCount: number;
    }> {
        const [expenseCount, budgetCount] = await Promise.all([
            ExpenseModel.count({ where: { category_id: categoryId } }),
            BudgetModel.count({ where: { category_id: categoryId } })
        ]);

        return {
            canDelete: expenseCount === 0 && budgetCount === 0,
            expenseCount,
            budgetCount
        };
    }

    /**
     * Delete all categories by user ID
     */
    async deleteByUserId(userId: number): Promise<void> {
        try {
            await this.delete({
                where: { user_id: userId } as WhereOptions<CategoryModel>
            });
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    /**
     * Find category by name for a specific user
     */
    async findByNameForUser(categoryName: string, userId: number): Promise<CategoryModel | null> {
        return this.findOne({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            where: {
                category_name: categoryName,
                user_id: userId
            }
        });
    }

    /**
     * Get categories for a specific user
     */
    async findByUserId(userId: number): Promise<CategoryModel[]> {
        return CategoryModel.findAll({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            where: { user_id: userId },
            order: [['category_name', 'ASC']]
        });
    }

    /**
     * Get user's own categories (excluding default categories)
     */
    async getUserCategories(userId: number): Promise<CategoryModel[]> {
        return CategoryModel.findAll({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            where: {
                user_id: userId,
                is_default: false
            },
            order: [['category_name', 'ASC']]
        });
    }

    /**
     * Count default categories for a user
     */
    async countDefaultCategoriesForUser(userId: number): Promise<number> {
        return CategoryModel.count({
            where: {
                user_id: userId,
                is_default: true
            }
        });
    }

    /**
     * Create default categories for a user
     */
    async createDefaultCategoriesForUser(userId: number): Promise<void> {
        const defaultCategories = [
            { category_name: 'Food & Dining', category_color: '#FF5733' },
            { category_name: 'Transportation', category_color: '#33FF57' },
            { category_name: 'Housing', category_color: '#3357FF' },
            { category_name: 'Entertainment', category_color: '#FF33F6' },
            { category_name: 'Shopping', category_color: '#33FFF6' },
            { category_name: 'Healthcare', category_color: '#F6FF33' },
            { category_name: 'Education', category_color: '#FF8333' },
            { category_name: 'Bills & Utilities', category_color: '#33FFB2' },
            { category_name: 'Other', category_color: '#808080' }
        ];

        const categoriesToCreate = defaultCategories.map(category => ({
            ...category,
            user_id: userId,
            is_default: true
        }));

        await CategoryModel.bulkCreate(categoriesToCreate);
    }

    /**
     * Find category by ID and user ID
     */
    async findByIdAndUserId(categoryId: number, userId: number): Promise<CategoryModel | null> {
        return this.findOne({
            attributes: ['category_id', 'category_name', 'category_color', 'user_id', 'is_default', 'created_at'],
            where: {
                category_id: categoryId,
                user_id: userId
            }
        });
    }

    /**
 * Check if category name exists for a specific user
 */
    async nameExistsForUser(categoryName: string, userId: number, excludeCategoryId?: number): Promise<boolean> {
        const where: any = {
            category_name: categoryName,
            user_id: userId
        };

        if (excludeCategoryId) {
            where.category_id = { [Op.ne]: excludeCategoryId };
        }   

        const count = await CategoryModel.count({ where: where });

        return count > 0;
    }
} 