import { BaseRepository } from './base.repository';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import type { CreateCategoryDTO, ExpenseCategory } from '../interfaces/category.interface';
import CategoryModel from '../models/category.model';
import ExpenseModel from '../models/expense.model';
import BudgetModel from '../models/budget.model';
import { Op, DestroyOptions, UpdateOptions } from 'sequelize';
import { CustomError } from '../utils/customError';
import { ERROR_CODES } from '../constants/errorCodes';

export class CategoryRepository extends BaseRepository<CategoryModel> {
    constructor() {
        super(CategoryModel);
    }

    /**
     * Create a new category
     */
    async createOne(categoryData: CreateCategoryDTO): Promise<CategoryModel> {
        return this.create({
            category_name: categoryData.category_name,
            category_color: categoryData.category_color
        });
    }

    /**
     * Find category by ID
     */
    override async findById(categoryId: number): Promise<CategoryModel | null> {
        return this.findOne({
            where: { category_id: categoryId }
        });
    }

    /**
     * Find category by name
     */
    async findByName(categoryName: string): Promise<CategoryModel | null> {
        return this.findOne({
            where: { category_name: categoryName }
        });
    }

    /**
     * Get all categories
     */
    override async findAll(): Promise<CategoryModel[]> {
        return super.findAll({
            order: [['category_name', 'ASC']]
        });
    }

    /**
     * Update category
     */
    async updateOne(categoryId: number, updateData: Partial<CreateCategoryDTO>): Promise<CategoryModel | null> {
        await this.update(updateData, {
            where: { category_id: categoryId }
        } as UpdateOptions<CategoryModel>);
        return this.findById(categoryId);
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
            group: ['category_id'],
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
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
                created_at: data.created_at
            };
        });
    }

    /**
     * Seed default categories
     */
    async seedDefaultCategories(): Promise<void> {
        for (const category of DEFAULT_CATEGORIES) {
            const exists = await this.nameExists(category.name);
            if (!exists) {
                await this.createOne({
                    category_name: category.name,
                    category_color: category.color
                });
            }
        }
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
                'created_at',
                [CategoryModel.sequelize!.fn('COUNT', CategoryModel.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [CategoryModel.sequelize!.fn('SUM', CategoryModel.sequelize!.col('Expenses.amount')), 'total_amount'],
                [CategoryModel.sequelize!.fn('MAX', CategoryModel.sequelize!.col('Expenses.created_at')), 'latest_expense_date']
            ],
            group: ['category_id'],
            order: [[CategoryModel.sequelize!.col('total_amount'), 'DESC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
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
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => {
            const data = category.get({ plain: true });
            const budget = data.Budget || {};
            return {
                category_id: data.category_id,
                category_name: data.category_name,
                category_color: data.category_color,
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
} 