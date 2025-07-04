import { configDotenv } from "dotenv";
import { Request, Response, NextFunction } from "express";
import { stat } from "fs";
import jwt from 'jsonwebtoken';
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";
import { handleControllerError } from "../utils/errorHandler";

configDotenv();

// Extend Express Request to include user property
declare module 'express' {
    interface Request {
        user?: {
            user_id: number;
            [key: string]: any;
        };
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            // Handle directly - don't pass to global error handler
            const error = new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ['Access denied - No token provided']);
            return handleControllerError(res, error);
        }

        const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
        if (!token) {
            // Handle directly - don't pass to global error handler
            const error = new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ['Invalid token format']);
            return handleControllerError(res, error);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = decoded as { user_id: number; [key: string]: any };
        next();
    } catch (error) {
        // Handle JWT library errors directly
        if (error instanceof jwt.JsonWebTokenError) {
            const customError = new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ['Invalid token']);
            return handleControllerError(res, customError);
        } else if (error instanceof jwt.TokenExpiredError) {
            const customError = new CustomError(ERROR_CODES.AUTH.TOKEN_EXPIRED, ['Token has expired']);
            return handleControllerError(res, customError);
        } else {
            // Only unexpected/unknown errors go to global error handler
            next(error);
        }
    }
};

export default verifyToken;
