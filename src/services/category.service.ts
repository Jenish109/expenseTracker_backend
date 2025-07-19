import { CategoryRepository } from "../repositories/category.repository";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../utils/errorCodes";
import type { CreateCategoryDTO, UpdateCategoryDTO, ExpenseCategory } from "../interfaces/category.interface";

export class CategoryService {
    private categoryRepository: CategoryRepository;

    constructor() {
        this.categoryRepository = new CategoryRepository();
    }

    /**
     * Create a new category
     */
    async createCategory(data: CreateCategoryDTO): Promise<ExpenseCategory> {
        // Check if category with same name exists for this user
        const existingCategory = await this.categoryRepository.findByNameForUser(data.categoryName, data.user_id);

        if (existingCategory) {
            throw new CustomError(ERROR_CODES.CATEGORY.ALREADY_EXISTS, ["Category already exists"]);
        }

        // Create category
        const category = await this.categoryRepository.createOne(data);

        return {
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            user_id: category.user_id!,
            is_default: category.is_default,
            created_at: category.created_at
        };
    }

    /**
     * Get all categories
     */
    async getAllCategories(): Promise<ExpenseCategory[]> {
        const categories = await this.categoryRepository.findAll();

        return categories.map(category => ({
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            user_id: category.user_id!,
            is_default: category.is_default,
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
        return this.categoryRepository.getCategoriesWithUsage();
    }

    /**
     * Get categories with expenses for a specific user
     */
    async getCategoriesWithExpensesForUser(userId: number): Promise<Array<ExpenseCategory & {
        expense_count: number;
        total_amount: number;
        latest_expense_date: Date;
    }>> {
        return this.categoryRepository.getCategoriesWithExpensesForUser(userId);
    }

    /**
     * Get categories with budgets for a specific user
     */
    async getCategoriesWithBudgetsForUser(userId: number): Promise<Array<ExpenseCategory & {
        budget_amount: number;
        budget_created_at: Date;
    }>> {
        return this.categoryRepository.getCategoriesWithBudgetsForUser(userId);
    }

    /**
     * Update a category
     */
    async updateCategory(categoryId: number, userId: number, data: UpdateCategoryDTO): Promise<ExpenseCategory> {
        const category = await this.categoryRepository.findByIdAndUserId(categoryId, userId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Prevent editing default categories
        if (category.is_default) {
            throw new CustomError(ERROR_CODES.CATEGORY.CANNOT_EDIT_DEFAULT, ["Default categories cannot be edited"]);
        }

        // Ensure user can only edit their own categories
        if (category.user_id !== userId) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_AUTHORIZED, ["You can only edit your own categories"]);
        }

        // Check if new name conflicts with existing category for this user
        if (data.categoryName) {
            const nameExists = await this.categoryRepository.nameExistsForUser(data.categoryName, userId, categoryId);

            if (nameExists) {
                throw new CustomError(ERROR_CODES.CATEGORY.ALREADY_EXISTS, ["Category already exists"]);
            }
        }

        const updatedCategory = await this.categoryRepository.updateOne(categoryId, data);
        if (!updatedCategory) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found after update"]);
        }

        return {
            category_id: updatedCategory.category_id,
            category_name: updatedCategory.category_name,
            category_color: updatedCategory.category_color,
            user_id: updatedCategory.user_id!,
            is_default: updatedCategory.is_default,
            created_at: updatedCategory.created_at
        };
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: number, userId: number): Promise<void> {
        const category = await this.categoryRepository.findByIdAndUserId(categoryId, userId);
        if (!category) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_FOUND, ["Category not found"]);
        }

        // Prevent deleting default categories
        if (category.is_default) {
            throw new CustomError(ERROR_CODES.CATEGORY.CANNOT_DELETE_DEFAULT, ["Default categories cannot be deleted"]);
        }

        // Ensure user can only delete their own categories
        if (category.user_id !== userId) {
            throw new CustomError(ERROR_CODES.CATEGORY.NOT_AUTHORIZED, ["You can only delete your own categories"]);
        }

        // Check if category can be safely deleted
        const canDelete = await this.categoryRepository.canDeleteCategory(categoryId);
        if (!canDelete.canDelete) {
            throw new CustomError(ERROR_CODES.CATEGORY.IN_USE, ["Category is in use and cannot be deleted"]);
        }

        await this.categoryRepository.deleteOne(categoryId);
    }

    /**
     * Get unused categories
     */
    async getUnusedCategories(): Promise<ExpenseCategory[]> {
        return this.categoryRepository.getUnusedCategories();
    }

    /**
     * Get user's own categories (excluding default categories)
     */
    async getUserCategories(userId: number): Promise<ExpenseCategory[]> {
        const categories = await this.categoryRepository.getUserCategories(userId);

        return categories.map(category => ({
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            user_id: category.user_id!,
            is_default: category.is_default,
            created_at: category.created_at
        }));
    }

    /**
     * Check and create default categories for a user if they don't exist
     */
    async ensureDefaultCategoriesForUser(userId: number): Promise<void> {
        // Check if user already has default categories
        const existingDefaultCategories = await this.categoryRepository.countDefaultCategoriesForUser(userId);

        // If user doesn't have default categories, create them
        if (existingDefaultCategories === 0) {
            await this.categoryRepository.createDefaultCategoriesForUser(userId);
        }
    }

    /**
     * Get categories for a specific user (including default categories)
     */
    async getCategoriesForUser(userId: number): Promise<ExpenseCategory[]> {
        // Ensure user has default categories
        await this.ensureDefaultCategoriesForUser(userId);

        const categories = await this.categoryRepository.findByUserId(userId);

        return categories.map(category => ({
            category_id: category.category_id,
            category_name: category.category_name,
            category_color: category.category_color,
            user_id: category.user_id!,
            is_default: category.is_default,
            created_at: category.created_at
        }));
    }
} 