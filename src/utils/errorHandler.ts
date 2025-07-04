import { Response } from 'express';
import { CustomError } from './customError';
import { ERROR_CODES, ErrorDetail } from '../constants/errorCodes';
import logger from '../utils/logger';

export interface SimplifiedError {
  error_name: string;
  message: string;
  code?: string;
  field?: string;
}

function simplifyDatabaseError(error: any): SimplifiedError[] {
  const errorReturn: SimplifiedError[] = [];

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    error.errors.forEach((err: any) => {
      errorReturn.push({
        error_name: 'ValidationError',
        message: err.message,
        field: err.path,
        code: ERROR_CODES.VALIDATION.INVALID_FORMAT.code
      });
    });
  } 
  // Handle unique constraint violations
  else if (error.name === 'SequelizeUniqueConstraintError') {
    const fields = error.fields ? Object.keys(error.fields).join(', ') : 'field';
    errorReturn.push({
      error_name: 'UniqueConstraintError',
      message: `Duplicate entry for ${fields}`,
      field: fields,
      code: ERROR_CODES.DATABASE.DUPLICATE_ENTRY.code
    });
  }
  // Handle foreign key violations
  else if (error.name === 'SequelizeForeignKeyConstraintError') {
    errorReturn.push({
      error_name: 'ForeignKeyError',
      message: 'Referenced record does not exist',
      field: error.fields?.join(', '),
      code: ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION.code
    });
  }
  // Handle connection errors
  else if (error.name === 'SequelizeConnectionError') {
    errorReturn.push({
      error_name: 'ConnectionError',
      message: 'Database connection failed',
      code: ERROR_CODES.DATABASE.CONNECTION_ERROR.code
    });
  }
  // Handle database timeout errors
  else if (error.name === 'SequelizeTimeoutError') {
    errorReturn.push({
      error_name: 'TimeoutError',
      message: 'Database operation timed out',
      code: ERROR_CODES.DATABASE.OPERATION_FAILED.code
    });
  }
  // Handle database connection refused
  else if (error.original?.code === 'ECONNREFUSED') {
    errorReturn.push({
      error_name: 'ConnectionRefused',
      message: 'Unable to connect to database',
      code: ERROR_CODES.DATABASE.CONNECTION_ERROR.code
    });
  }
  // Handle unknown database errors
  else {
    errorReturn.push({
      error_name: 'DatabaseError',
      message: error.message || 'An unknown database error occurred',
      code: ERROR_CODES.DATABASE.OPERATION_FAILED.code
    });
  }

  return errorReturn;
}

export function handleDatabaseError(error: unknown): never {
  if (error instanceof CustomError) {
    logger.error('Database CustomError:', error);
    throw error;
  }

  logger.error('Database Error:', error);
  const simplifiedErrors = simplifyDatabaseError(error);
  const errorMessages = simplifiedErrors.map(e => e.message);
  
  // Find the most specific error code from the simplified errors
  const errorCode = simplifiedErrors[0]?.code 
    ? Object.values(ERROR_CODES.DATABASE).find(e => e.code === simplifiedErrors[0].code)
    : ERROR_CODES.DATABASE.OPERATION_FAILED;

  throw new CustomError(errorCode || ERROR_CODES.DATABASE.OPERATION_FAILED, errorMessages);
}

export function handleServiceError(error: unknown): never {
  if (error instanceof CustomError) {
    logger.error('Service CustomError:', error);
    throw error;
  }

  logger.error('Service Error:', error);
  
  // Handle specific service errors
  if (error instanceof TypeError) {
    throw new CustomError(ERROR_CODES.VALIDATION.TYPE_MISMATCH, [error.message]);
  }
  
  if (error instanceof RangeError) {
    throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.message]);
  }
  
  if (error instanceof URIError) {
    throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ['Invalid URL format']);
  }

  throw new CustomError(ERROR_CODES.SERVICE.OPERATION_FAILED, [
    'An unexpected service error occurred',
  ]);
}

export function handleControllerError(res: Response, error: unknown): void {
  logger.error('Controller Error:', error);
  
  if (error instanceof CustomError) {
    sendErrorResponse(res, error.errorDetail, error.errors);
    return;
  }

  // Handle Sequelize errors
  if ((error as any).name?.startsWith('Sequelize')) {
    const dbError = error as any;
    
    // Handle unique constraint violations
    if (dbError.name === 'SequelizeUniqueConstraintError') {
      // Generic duplicate entry handling
      const fields = dbError.fields ? Object.keys(dbError.fields).join(', ') : 'field';
      sendErrorResponse(res, ERROR_CODES.DATABASE.DUPLICATE_ENTRY, [
        `Duplicate entry detected for ${fields}`
      ]);
      return;
    }

    // Handle foreign key violations
    if (dbError.name === 'SequelizeForeignKeyConstraintError') {
      sendErrorResponse(res, ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION, [
        'Referenced record does not exist'
      ]);
      return;
    }

    // Handle validation errors
    if (dbError.name === 'SequelizeValidationError') {
      const validationErrors = dbError.errors.map((err: any) => err.message);
      sendErrorResponse(res, ERROR_CODES.VALIDATION.INVALID_FORMAT, validationErrors);
      return;
    }

    // Handle other database errors
    sendErrorResponse(res, ERROR_CODES.DATABASE.OPERATION_FAILED, [
      'Database operation failed'
    ]);
    return;
  }

  // Handle validation errors from express-validator
  if (error instanceof Array && error.length > 0 && 'msg' in error[0]) {
    const validationErrors = error.map((err: any) => err.msg);
    sendErrorResponse(res, ERROR_CODES.VALIDATION.INVALID_FORMAT, validationErrors);
    return;
  }

  // Handle other known error types
  if (error instanceof SyntaxError) {
    sendErrorResponse(res, ERROR_CODES.VALIDATION.INVALID_FORMAT, [error.message]);
    return;
  }

  if (error instanceof ReferenceError) {
    sendErrorResponse(res, ERROR_CODES.GENERAL.SERVER_ERROR, [error.message]);
    return;
  }

  sendErrorResponse(res, ERROR_CODES.GENERAL.SERVER_ERROR, [
    'An unexpected error occurred',
  ]);
}

function sendErrorResponse(
  res: Response,
  errorDetail: ErrorDetail,
  errors: string[] = []
): void {
  res.status(errorDetail.statusCode).json({
    success: false,
    error: {
      code: errorDetail.code,
      message: errorDetail.message,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
} 