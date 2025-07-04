import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../interfaces/base.interface';
import { HTTP_STATUS } from './constants';
import { CustomError } from './errors';

/**
 * Standardized success response helper
 */
export const successResponse = <T>(
    res: Response,
    data: T,
    message: string,
    statusCode: number = HTTP_STATUS.OK
): Response<ApiResponse<T>> => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        status_code: statusCode,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};

/**
 * Standardized error response helper
 */
export const errorResponse = (
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error?: string
): Response<ApiResponse> => {
    const response: ApiResponse = {
        success: false,
        message,
        error,
        status_code: statusCode,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};

/**
 * Standardized paginated response helper
 */
export const paginatedResponse = <T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message: string,
    statusCode: number = HTTP_STATUS.OK
): Response<PaginatedResponse<T>> => {
    const response: PaginatedResponse<T> = {
        success: true,
        message,
        data,
        pagination,
        status_code: statusCode,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
    currentPage: number,
    perPage: number,
    total: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / perPage);
    
    return {
        current_page: currentPage,
        per_page: perPage,
        total,
        total_pages: totalPages,
        has_next_page: currentPage < totalPages,
        has_prev_page: currentPage > 1,
    };
};

/**
 * Validation error response
 */
export const validationErrorResponse = (
    res: Response,
    errors: Array<{ field: string; message: string }>,
    message: string = 'Validation failed'
): Response<ApiResponse> => {
    const response: ApiResponse = {
        success: false,
        message,
        error: 'Validation Error',
        data: { validation_errors: errors },
        status_code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        timestamp: new Date().toISOString(),
    };
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
};

/**
 * Not found response
 */
export const notFoundResponse = (
    res: Response,
    resource: string = 'Resource'
): Response<ApiResponse> => {
    return errorResponse(
        res,
        `${resource} not found`,
        HTTP_STATUS.NOT_FOUND,
        'Not Found'
    );
};

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (
    res: Response,
    message: string = 'Unauthorized access'
): Response<ApiResponse> => {
    return errorResponse(
        res,
        message,
        HTTP_STATUS.UNAUTHORIZED,
        'Unauthorized'
    );
};

/**
 * Forbidden response
 */
export const forbiddenResponse = (
    res: Response,
    message: string = 'Access forbidden'
): Response<ApiResponse> => {
    return errorResponse(
        res,
        message,
        HTTP_STATUS.FORBIDDEN,
        'Forbidden'
    );
};

/**
 * Conflict response
 */
export const conflictResponse = (
    res: Response,
    message: string
): Response<ApiResponse> => {
    return errorResponse(
        res,
        message,
        HTTP_STATUS.CONFLICT,
        'Conflict'
    );
};

/**
 * Created response
 */
export const createdResponse = <T>(
    res: Response,
    data: T,
    message: string
): Response<ApiResponse<T>> => {
    return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * No content response
 */
export const noContentResponse = (res: Response): Response => {
    return res.status(204).send();
};

export const handleResponse = <T>(res: Response, message: string, data?: T): Response<ApiResponse<T>> => {
    return res.status(200).json({
        success: true,
        message,
        data
    });
};

export const handleError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: unknown
): Response<ApiResponse> => {
    // If error is a CustomError, use its status code
    if (error instanceof CustomError) {
        statusCode = error.statusCode;
    }

    return res.status(statusCode).json({
        success: false,
        message,
        error: error instanceof Error ? error.message : error
    });
}; 