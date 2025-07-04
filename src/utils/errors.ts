import { HTTP_STATUS } from './constants';

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly timestamp: string;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code?: string,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        this.code = code;
        
        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
    public readonly validationErrors: Array<{ field: string; message: string; value?: any }>;

    constructor(
        message: string = 'Validation failed',
        validationErrors: Array<{ field: string; message: string; value?: any }> = []
    ) {
        super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        this.validationErrors = validationErrors;
    }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
    }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, HTTP_STATUS.CONFLICT);
    }
}

/**
 * Bad request error class
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, HTTP_STATUS.BAD_REQUEST);
    }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message: string = 'External service error') {
        super(`${service}: ${message}`, HTTP_STATUS.BAD_REQUEST);
    }
}

/**
 * Helper function to check if error is operational
 */
export const isOperationalError = (error: Error): boolean => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};

export class CustomError extends AppError {
    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message, statusCode, code);
        this.name = 'CustomError';
    }
} 