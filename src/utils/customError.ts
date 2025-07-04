import { ERROR_CODES } from '../constants/errorCodes';

type ErrorCodeType = typeof ERROR_CODES;
type ErrorDetail = {
  code: string;
  message: string;
  statusCode: number;
};

export class CustomError extends Error {
  public readonly errorDetail: ErrorDetail;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    errorDetail: ErrorDetail,
    errors: string[] = [],
    isOperational = true
  ) {
    super(errorDetail.message);

    // Maintain proper stack trace
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.errorDetail = errorDetail;
    this.errors = errors;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory method for creating validation errors
   */
  static validation(errors: string[]): CustomError {
    return new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, errors);
  }

  /**
   * Factory method for creating authentication errors
   */
  static authentication(message?: string): CustomError {
    return new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, [
      message || ERROR_CODES.AUTH.INVALID_TOKEN.message,
    ]);
  }

  /**
   * Factory method for creating authorization errors
   */
  static authorization(message?: string): CustomError {
    return new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, [
      message || ERROR_CODES.AUTH.ACCESS_DENIED.message,
    ]);
  }

  /**
   * Factory method for creating not found errors
   */
  static notFound(resource: string): CustomError {
    return new CustomError(ERROR_CODES.GENERAL.NOT_FOUND, [
      `${resource} not found`,
    ]);
  }

  /**
   * Factory method for creating database errors
   */
  static database(message?: string): CustomError {
    return new CustomError(ERROR_CODES.DATABASE.OPERATION_FAILED, [
      message || ERROR_CODES.DATABASE.OPERATION_FAILED.message,
    ]);
  }

  /**
   * Factory method for creating service errors
   */
  static service(message?: string): CustomError {
    return new CustomError(ERROR_CODES.SERVICE.OPERATION_FAILED, [
      message || ERROR_CODES.SERVICE.OPERATION_FAILED.message,
    ]);
  }

  /**
   * Factory method for creating bad request errors
   */
  static badRequest(message?: string): CustomError {
    return new CustomError(ERROR_CODES.GENERAL.BAD_REQUEST, [
      message || ERROR_CODES.GENERAL.BAD_REQUEST.message,
    ]);
  }

  /**
   * Factory method for creating rate limit errors
   */
  static rateLimit(message?: string): CustomError {
    return new CustomError(ERROR_CODES.GENERAL.TOO_MANY_REQUESTS, [
      message || ERROR_CODES.GENERAL.TOO_MANY_REQUESTS.message,
    ]);
  }

  /**
   * Factory method for creating duplicate entry errors
   */
  static duplicate(field: string): CustomError {
    return new CustomError(ERROR_CODES.DATABASE.DUPLICATE_ENTRY, [
      `Duplicate entry for ${field}`,
    ]);
  }

  /**
   * Factory method for creating constraint violation errors
   */
  static constraint(message?: string): CustomError {
    return new CustomError(ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION, [
      message || ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION.message,
    ]);
  }

  /**
   * Factory method for creating server errors
   */
  static server(message?: string, isOperational = false): CustomError {
    return new CustomError(
      ERROR_CODES.GENERAL.SERVER_ERROR,
      [message || ERROR_CODES.GENERAL.SERVER_ERROR.message],
      isOperational
    );
  }
} 