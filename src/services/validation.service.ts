import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { createBudgetSchema, updateBudgetSchema } from "../validations/budgetSchema";
import { createExpenseSchema, updateExpenseSchema } from "../validations/expenseSchema";
import type { CreateBudgetDTO, UpdateBudgetDTO } from "../interfaces/budget.interface";
import type { CreateExpenseDTO, UpdateExpenseDTO } from "../interfaces/expense.interface";

export class ValidationService {
    /**
     * Validate budget creation data
     */
    static validateCreateBudget(data: CreateBudgetDTO): void {
        const schemaData = {
            amount: data.amount,
            categoryId: data.categoryId,
            startDate: data.startDate || new Date(),
            endDate: data.endDate || new Date()
        };

        const { error } = createBudgetSchema.validate(schemaData);
        if (error) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.details[0].message]);
        }
    }

    /**
     * Validate budget update data
     */
    static validateUpdateBudget(data: UpdateBudgetDTO): void {
        const schemaData = {
            amount: data.amount,
            startDate: data.startDate,
            endDate: data.endDate
        };

        const { error } = updateBudgetSchema.validate(schemaData);
        if (error) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.details[0].message]);
        }
    }

    /**
     * Validate expense creation data
     */
    static validateCreateExpense(data: CreateExpenseDTO): void {
        const { error } = createExpenseSchema.validate(data);
        if (error) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.details[0].message]);
        }
    }

    /**
     * Validate expense update data
     */
    static validateUpdateExpense(data: UpdateExpenseDTO): void {
        const { error } = updateExpenseSchema.validate(data);
        if (error) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.details[0].message]);
        }
    }

    /**
     * Validate pagination parameters
     */
    static validatePagination(page?: number, limit?: number): { page: number; limit: number } {
        const validPage = Math.max(1, Number(page) || 1);
        const validLimit = Math.min(100, Math.max(1, Number(limit) || 10));

        return { page: validPage, limit: validLimit };
    }

    /**
     * Validate date range
     */
    static validateDateRange(startDate: string, endDate: string): { startDate: Date; endDate: Date } {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ['Invalid start date']);
        }

        if (isNaN(end.getTime())) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ['Invalid end date']);
        }

        if (end < start) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ['End date must be after start date']);
        }

        return { startDate: start, endDate: end };
    }

    /**
     * Validate amount
     */
    static validateAmount(amount: number): number {
        const validAmount = Number(amount);

        if (isNaN(validAmount)) {
            throw new CustomError(ERROR_CODES.VALIDATION.TYPE_MISMATCH, ['Invalid amount']);
        }

        if (validAmount <= 0) {
            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ['Amount must be greater than 0']);
        }

        return validAmount;
    }
} 