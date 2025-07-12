import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { CustomError } from '../utils/customError';
import logger from '../utils/logger';
import { ERROR_CODES } from '../constants/errorCodes';

export const validatePayload = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error('Validation error:', error);
            const errorDetail = error.details[0];

            if (errorDetail.type.startsWith('any')) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, [
                    error.details[0].message,
                ]);
            } else if (errorDetail.type.includes('.base')) {
                throw new CustomError(ERROR_CODES.VALIDATION.TYPE_MISMATCH, [
                    error.details[0].message,
                ]);
            }

            throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, [
                error.details[0].message,
            ]);
        }
        next();
    };
}; 