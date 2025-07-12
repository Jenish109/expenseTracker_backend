import { NextFunction, Request, Response } from "express";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";
import type { LoginDTO, RegisterDTO } from "../interfaces/auth.interface";
import { AuthService } from "../services/auth.service";
import { CustomError } from "../utils/customError";
import { ERROR_CODES } from "../constants/errorCodes";

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
}