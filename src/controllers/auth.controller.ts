import { NextFunction, Request, Response } from "express";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";
import type { LoginDTO, RegisterDTO } from "../interfaces/auth.interface";
import { AuthService } from "../services/auth.service";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../utils/errorCodes";
import { SUCCESS_CODES } from "../constants/successCodes";
import { successResponse, errorResponse } from "../utils/response.helper";

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Register a new user
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const registerData: RegisterDTO = req.body;

            await this.authService.register(registerData);

            logger.logPerformance('User Registration', startTime);

            res.status(201).json({
                success: true,
                message: "User registered successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * User Login
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const loginData: LoginDTO = {
                email: req.body.email || "",
                password: req.body.password || "",
                username: req.body.username || ""
            };

            const loginResult = await this.authService.login(loginData);

            logger.logPerformance('User Login', startTime);

            res.status(200).json({
                success: true,
                data: loginResult,
                message: "Login successful"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Refresh Token
     */
    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const refreshToken = req.body.refresh_token;
            if (!refreshToken) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ["Refresh token is required"]);
            }

            const tokens = await this.authService.refreshToken(refreshToken);

            logger.logPerformance('Token Refresh', startTime);

            res.status(200).json({
                success: true,
                data: tokens,
                message: "Token refreshed successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    /**
     * Logout
     */
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const userId = req.user?.user_id;
            if (!userId) {
                throw new CustomError(ERROR_CODES.AUTH.ACCESS_DENIED, ["User not authenticated"]);
            }

            await this.authService.logout(userId);

            logger.logPerformance('User Logout', startTime);

            res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async verifyUserEmail(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const token = req.query.token as string;

            const user = await this.authService.verifyUserEmail(token);

            logger.logPerformance('User Email Verification', startTime);

            res.status(200).json({
                success: true,
                data: user,
                message: "Email verified successfully"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            const result = await this.authService.forgotPassword({
                email,
            });

            if (!result) {
                throw new CustomError(ERROR_CODES.AUTH.FORGOT_PASSWORD_FAILED, ['User with provided email not found']);
            }

            return successResponse(res, SUCCESS_CODES.AUTH.FORGOT_PASSWORD, "Password reset email sent successfully");
        } catch (error) {
            handleControllerError(res, error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;

            const user = await this.authService.resetPassword(token, password);

            if (!user) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_CODE, ["Invalid or expired reset token"]);
            }

            return successResponse(res, SUCCESS_CODES.AUTH.CHANGE_PASSWORD, "Password reset successfully");
        } catch (error) {
            handleControllerError(res, error);
        }
    }

}