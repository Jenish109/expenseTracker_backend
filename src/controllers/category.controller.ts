import { NextFunction, Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    /**
     * Get all categories
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