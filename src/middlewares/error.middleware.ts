import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/customError';
import { ERROR_CODES } from '../constants/errorCodes';
import logger from '../utils/logger';

interface ExtendedResponse extends Response {
  body?: any;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log error with context
    logger.logError(error, 'Global Error Handler');
    logger.logRequest(req);

    // Handle CustomError instances
    if (error instanceof CustomError) {
        res.status(error.errorDetail.statusCode).json({
            success: false,
            error: {
                code: error.errorDetail.code,
                message: error.errorDetail.message,
                errors: error.errors.length > 0 ? error.errors : undefined,
            },
        });
        return;
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: {
                code: ERROR_CODES.AUTH.INVALID_TOKEN.code,
                message: ERROR_CODES.AUTH.INVALID_TOKEN.message,
            },
        });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                code: ERROR_CODES.AUTH.TOKEN_EXPIRED.code,
                message: ERROR_CODES.AUTH.TOKEN_EXPIRED.message,
            },
        });
        return;
    }

    // Handle validation errors (e.g., from express-validator)
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION.INVALID_FORMAT.code,
                message: ERROR_CODES.VALIDATION.INVALID_FORMAT.message,
                errors: [(error as any).details?.map((d: any) => d.message)].flat(),
            },
        });
        return;
    }

    // Handle Sequelize errors
    if (error.name?.startsWith('Sequelize')) {
        const dbError = error as any;
        
        // Handle unique constraint violations
        if (dbError.name === 'SequelizeUniqueConstraintError') {
            const fields = dbError.fields ? Object.keys(dbError.fields).join(', ') : 'field';
            res.status(409).json({
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE.DUPLICATE_ENTRY.code,
                    message: `Duplicate entry for ${fields}`,
                    fields: dbError.fields,
                },
            });
            return;
        }

        // Handle foreign key violations
        if (dbError.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION.code,
                    message: 'Referenced record does not exist',
                    fields: dbError.fields,
                },
            });
            return;
        }

        // Handle validation errors
        if (dbError.name === 'SequelizeValidationError') {
            res.status(400).json({
                success: false,
                error: {
                    code: ERROR_CODES.VALIDATION.INVALID_FORMAT.code,
                    message: 'Validation error',
                    errors: dbError.errors.map((err: any) => ({
                        field: err.path,
                        message: err.message,
                    })),
                },
            });
            return;
        }

        // Handle other database errors
        res.status(500).json({
            success: false,
            error: {
                code: ERROR_CODES.DATABASE.OPERATION_FAILED.code,
                message: ERROR_CODES.DATABASE.OPERATION_FAILED.message,
            },
        });
        return;
    }

    // Handle syntax errors
    if (error instanceof SyntaxError) {
        res.status(400).json({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION.INVALID_FORMAT.code,
                message: 'Invalid JSON format',
                detail: error.message,
            },
        });
        return;
    }

    // Handle all other errors
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        success: false,
        error: {
            code: ERROR_CODES.GENERAL.SERVER_ERROR.code,
            message: isProduction 
                ? ERROR_CODES.GENERAL.SERVER_ERROR.message 
                : error.message || ERROR_CODES.GENERAL.SERVER_ERROR.message,
            stack: isProduction ? undefined : error.stack,
        },
    });
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: {
            code: ERROR_CODES.GENERAL.NOT_FOUND.code,
            message: `Route ${req.originalUrl} not found`,
        },
    });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    logger.logRequest(req);
    next();
};

/**
 * Response logging middleware
 */
export const responseLogger = (req: Request, res: ExtendedResponse, next: NextFunction): void => {
    const originalSend = res.send;
    res.send = function (body) {
        res.body = body;
        logger.logResponse(res);
        return originalSend.call(this, body);
    };
    next();
};

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = (): void => {
    process.on('unhandledRejection', (reason: Error) => {
        logger.error('Unhandled Promise Rejection:', {
            reason: reason.message,
            stack: reason.stack,
        });
        // In development, we might want to crash
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    });
};

/**
 * Uncaught exception handler
 */
export const uncaughtExceptionHandler = (): void => {
    process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception:', {
            error: error.message,
            stack: error.stack,
        });
        // Always exit on uncaught exceptions
        process.exit(1);
    });
}; 