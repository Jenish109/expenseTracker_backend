import { NextFunction, Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "../interfaces/category.interface";

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    /**
     * Get all categories (including default and user's own)
     */
    async getCategoriesForUser(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = (req as any).user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const categories = await this.categoryService.getCategoriesForUser(userId);

            logger.logPerformance('Get Categories For User', startTime);
            logger.info('Categories retrieved successfully', { count: categories.length, userId });

            res.status(200).json({
                success: true,
                data: categories,
                message: "Categories retrieved successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get user's own categories (excluding default categories)
     */
    async getUserCategories(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = (req as any).user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const categories = await this.categoryService.getUserCategories(userId);

            logger.logPerformance('Get User Categories', startTime);
            logger.info('User categories retrieved successfully', { count: categories.length, userId });

            res.status(200).json({
                success: true,
                data: categories,
                message: "User categories retrieved successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Create a new category
     */
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = (req as any).user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const categoryData: CreateCategoryDTO = {
                ...req.body,
                user_id: userId
            };

            const category = await this.categoryService.createCategory(categoryData);

            logger.logPerformance('Create Category', startTime);
            logger.info('Category created successfully', { categoryId: category.category_id, userId });

            res.status(201).json({
                success: true,
                data: category,
                message: "Category created successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Update a category
     */
    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = (req as any).user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const categoryId = parseInt(req.params.id);
            const updateData: UpdateCategoryDTO = req.body;

            const category = await this.categoryService.updateCategory(categoryId, userId, updateData);

            logger.logPerformance('Update Category', startTime);
            logger.info('Category updated successfully', { categoryId, userId });

            res.status(200).json({
                success: true,
                data: category,
                message: "Category updated successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Delete a category
     */
    async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = (req as any).user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            const categoryId = parseInt(req.params.id);

            await this.categoryService.deleteCategory(categoryId, userId);

            logger.logPerformance('Delete Category', startTime);
            logger.info('Category deleted successfully', { categoryId, userId });

            res.status(200).json({
                success: true,
                message: "Category deleted successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get all categories (admin only - for backward compatibility)
     */
    async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const categories = await this.categoryService.getAllCategories();

            logger.logPerformance('Get All Categories', startTime);
            logger.info('Categories retrieved successfully', { count: categories.length });

            res.status(200).json({
                success: true,
                data: categories,
                message: "Categories retrieved successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }
} 