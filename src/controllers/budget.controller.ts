import { Request, Response } from "express";
import { BudgetService } from "../services/budget.service";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";

export class BudgetController {
    private budgetService: BudgetService;

    constructor() {
        this.budgetService = new BudgetService();
    }

    async addBudget(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const budgetData = {
                categoryId: req.body.categoryId,
                amount: req.body.amount,
                startDate: req.body.startDate || new Date(),
                endDate: req.body.endDate || new Date()
            };

            // Create budget with validated data
            await this.budgetService.addBudget(userId, budgetData);

            logger.logPerformance('Create Budget', startTime);
            logger.info('Budget created successfully', { userId });

            res.status(201).json({
                success: true,
                message: "Budget created successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async updateBudget(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const budgetId = parseInt(req.params.id);
            if (!budgetId) {
                throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Invalid budget ID"]);
            }

            const updateData = {
                amount: req.body.amount,
                startDate: req.body.startDate || new Date(),
                endDate: req.body.endDate || new Date(),
                categoryId: req.body.categoryId
            };

            // Update budget with validated data
            const budget = await this.budgetService.updateBudget(budgetId, userId, updateData);

            logger.logPerformance('Update Budget', startTime);
            logger.info('Budget updated successfully', { budgetId });

            res.status(200).json({
                success: true,
                data: budget,
                message: "Budget updated successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async deleteBudget(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const budgetId = parseInt(req.params.id);
            if (!budgetId) {
                throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Invalid budget ID"]);
            }

            await this.budgetService.deleteBudget(budgetId, userId);

            logger.logPerformance('Delete Budget', startTime);
            logger.info('Budget deleted successfully', { budgetId });

            res.status(200).json({
                success: true,
                message: "Budget deleted successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async getBudgetList(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            // Get query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;
            const categoryId = parseInt(req.query.categoryId as string);

            const budgetData = await this.budgetService.getBudgetListWithSpending(userId, {
                page,
                limit,
                search: search ? search.trim() : undefined,
                categoryId: !isNaN(categoryId) ? categoryId : undefined
            });

            logger.logPerformance('Get Budget List', startTime);
            logger.info('Budget list fetched successfully', { userId });

            res.status(200).json({
                success: true,
                data: budgetData,
                message: "Budget list fetched successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async getBudgetById(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const budgetId = parseInt(req.params.id);
            if (!budgetId) {
                throw new CustomError(ERROR_CODES.BUDGET.NOT_FOUND, ["Invalid budget ID"]);
            }

            const budget = await this.budgetService.getBudgetById(budgetId, userId);

            logger.logPerformance('Get Budget By ID', startTime);
            logger.info('Budget fetched successfully', { budgetId });

            res.status(200).json({
                success: true,
                data: budget,
                message: "Budget fetched successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }
}