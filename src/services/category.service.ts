import { Category, Expense, Budget } from "../models";
import { ValidationService } from "./validation.service";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import type { CreateCategoryDTO, UpdateCategoryDTO, ExpenseCategory } from "../interfaces/category.interface";
import { Op } from "sequelize";

export class CategoryService {
    /**
     * Create a new category
     */
    async createCategory(data: CreateCategoryDTO): Promise<ExpenseCategory> {
        // Check if category with same name exists
        const existingCategory = await Category.findOne({
            where: {
                category_name: {
                    [Op.like]: data.category_name
                }
            }
        });

        if (existingCategory) {
            throw new CustomError(ERROR_CODES.CATEGORY.ALREADY_EXISTS, ["Category already exists"]);
        }

        // Create category
        const category = await Category.create({
            category_name: data.category_name,
            category_color: data.category_color
        });

        return {
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            created_at: category.created_at
        };
    }

    /**
     * Get all categories
     */
    async getAllCategories(): Promise<ExpenseCategory[]> {
        const categories = await Category.findAll({
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => ({
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            created_at: category.created_at
        }));
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
        const categories = await Category.findAll({
            include: [
                {
                    model: Expense,
                    attributes: []
                },
                {
                    model: Budget,
                    attributes: []
                }
            ],
            attributes: [
                'category_id',
                'category_name',
                'category_color',
                'created_at',
                [Category.sequelize!.fn('COUNT', Category.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [Category.sequelize!.fn('COUNT', Category.sequelize!.col('Budgets.budget_id')), 'budget_count'],
                [Category.sequelize!.fn('SUM', Category.sequelize!.col('Expenses.amount')), 'total_expenses']
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
     * Get categories with expenses for a specific user
     */
    async getCategoriesWithExpensesForUser(userId: number): Promise<Array<ExpenseCategory & {
        expense_count: number;
        total_amount: number;
        latest_expense_date: Date;
    }>> {
        const categories = await Category.findAll({
            include: [{
                model: Expense,
                where: { user_id: userId },
                attributes: []
            }],
            attributes: [
                'category_id',
                'category_name',
                'category_color',
                'created_at',
                [Category.sequelize!.fn('COUNT', Category.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [Category.sequelize!.fn('SUM', Category.sequelize!.col('Expenses.amount')), 'total_amount'],
                [Category.sequelize!.fn('MAX', Category.sequelize!.col('Expenses.expense_date')), 'latest_expense_date']
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
                total_amount: Number(data.total_amount) || 0,
                latest_expense_date: data.latest_expense_date
            };
        });
    }

    /**
     * Get categories with budgets for a specific user
     */
    async getCategoriesWithBudgetsForUser(userId: number): Promise<Array<ExpenseCategory & {
        budget_amount: number;
        budget_created_at: Date;
    }>> {
        const categories = await Category.findAll({
            include: [{
                model: Budget,
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
     * Update a category
     */
    async updateCategory(categoryId: number, data: UpdateCategoryDTO): Promise<ExpenseCategory> {
        const category = await Category.findByPk(categoryId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Check if new name conflicts with existing category
        if (data.category_name) {
            const existingCategory = await Category.findOne({
                where: {
                    category_id: { [Op.ne]: categoryId },
                    category_name: { [Op.like]: data.category_name }
                }
            });

            if (existingCategory) {
                throw new CustomError(ERROR_CODES.CATEGORY.ALREADY_EXISTS, ["Category already exists"]);
            }
        }

        await category.update(data);

        return {
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            created_at: category.created_at
        };
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: number): Promise<void> {
        const category = await Category.findByPk(categoryId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Check if category can be safely deleted
        const [expenseCount, budgetCount] = await Promise.all([
            Expense.count({ where: { category_id: categoryId } }),
            Budget.count({ where: { category_id: categoryId } })
        ]);

        if (expenseCount > 0 || budgetCount > 0) {
            throw new CustomError(ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION, ["Category is in use and cannot be deleted"]);
        }

        await category.destroy();
    }

    /**
     * Get unused categories
     */
    async getUnusedCategories(): Promise<ExpenseCategory[]> {
        const categories = await Category.findAll({
            include: [
                {
                    model: Expense,
                    attributes: []
                },
                {
                    model: Budget,
                    attributes: []
                }
            ],
            attributes: [
                'category_id',
                'category_name',
                'category_color',
                'created_at',
                [Category.sequelize!.fn('COUNT', Category.sequelize!.col('Expenses.expense_id')), 'expense_count'],
                [Category.sequelize!.fn('COUNT', Category.sequelize!.col('Budgets.budget_id')), 'budget_count']
            ],
            group: ['category_id'],
            having: Category.sequelize!.literal('expense_count = 0 AND budget_count = 0'),
            order: [['category_name', 'ASC']]
        });

        return categories.map(category => ({
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            created_at: category.created_at
        }));
    }
} 