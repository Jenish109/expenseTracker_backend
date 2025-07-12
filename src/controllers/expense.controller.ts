import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from "../services/expense.service";
import type { CreateExpenseDTO, UpdateExpenseDTO } from "../interfaces/expense.interface";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { handleControllerError } from '../utils/errorHandler';
import logger from '../utils/logger';
import { ExpenseRepository } from '../repositories/expense.repository';
import { CategoryRepository } from '../repositories/category.repository';

// Extend Express Request to include user property
declare module 'express' {
    interface Request {
        user?: {
            user_id: number;
            [key: string]: any;
        };
    }
}

export class ExpenseController {
    private expenseService: ExpenseService;

    constructor() {
        const expenseRepository = new ExpenseRepository();
        const categoryRepository = new CategoryRepository();
        this.expenseService = new ExpenseService(expenseRepository, categoryRepository);
    }

    /**
     * Get all expenses for a user
     */
    async getAllExpenses(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;
            const categoryId = parseInt(req.query.categoryId as string);

            const expenses = await this.expenseService.getExpenseList(userId, {
                page,
                limit,
                startDate,
                endDate,
                categoryId: !isNaN(categoryId) ? categoryId : undefined
            });

            logger.logPerformance('Get All Expenses', startTime);
            logger.info('Expenses retrieved successfully', { userId });

            res.status(200).json({
                success: true,
                data: expenses,
                message: "Expenses retrieved successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get a single expense by ID
     */
    async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const expenseId = parseInt(req.params.id);
            const userId = req.user?.user_id;

            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            if (!expenseId) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ["Invalid expense ID"]);
            }

            const expense = await this.expenseService.getExpenseById(expenseId, userId);

            logger.logPerformance('Get Expense by ID', startTime);
            logger.info('Expense retrieved successfully', { expenseId });

            res.status(200).json({
                success: true,
                data: expense,
                message: "Expense retrieved successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Create a new expense
     */
    async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const expenseData: CreateExpenseDTO = {
                category_id: parseInt(req.body.category_id),
                amount: parseFloat(req.body.amount),
                expense_name: req.body.expense_name.trim(),
                description: req.body.description.trim(),
                expense_date: req.body.expense_date ? new Date(req.body.expense_date) : new Date()
            };

            const expense = await this.expenseService.createExpense(userId, expenseData);

            logger.logPerformance('Create Expense', startTime);
            logger.info('Expense created successfully', { expenseId: expense.expense_id });

            res.status(201).json({
                success: true,
                data: expense,
                message: "Expense created successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Update an expense
     */
    async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const expenseId = parseInt(req.params.id);
            const userId = req.user?.user_id;
            
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            if (!expenseId) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ["Invalid expense ID"]);
            }

            const updateData: UpdateExpenseDTO = {
                category_id: req.body.category_id,
                amount: req.body.amount,
                expense_name: req.body.expense_name,
                description: req.body.description,
                expense_date: req.body.expense_date ? new Date(req.body.expense_date) : undefined
            };

            const updatedExpense = await this.expenseService.updateExpense(expenseId, userId, updateData);

            logger.logPerformance('Update Expense', startTime);
            logger.info('Expense updated successfully', { expenseId });

            res.status(200).json({
                success: true,
                data: updatedExpense,
                message: "Expense updated successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Delete an expense
     */
    async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const expenseId = parseInt(req.params.id);
            const userId = req.user?.user_id;
            
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            if (!expenseId) {
                throw new CustomError(ERROR_CODES.EXPENSE.NOT_FOUND, ["Invalid expense ID"]);
            }

            await this.expenseService.deleteExpense(expenseId, userId);

            logger.logPerformance('Delete Expense', startTime);
            logger.info('Expense deleted successfully', { expenseId });

            res.status(200).json({
                success: true,
                message: "Expense deleted successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get expense summary
     */
    async getExpenseSummary(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const summary = await this.expenseService.getExpenseSummaryByCategory(userId, startDate, endDate);

            logger.logPerformance('Get Expense Summary', startTime);
            logger.info('Expense summary retrieved successfully', { userId });

            res.status(200).json({
                success: true,
                data: summary,
                message: "Expense summary retrieved successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Get expense trends
     */
    async getExpenseTrends(req: Request, res: Response) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
            const limit = parseInt(req.query.limit as string) || 12;

            const trends = await this.expenseService.getExpenseTrends(userId, period, limit);

            logger.logPerformance('Get Expense Trends', startTime);
            logger.info('Expense trends retrieved successfully', { userId });

            res.status(200).json({
                success: true,
                data: trends,
                message: "Expense trends retrieved successfully"
            });
        } catch (error) {
            handleControllerError(res, error);
        }
    }
}