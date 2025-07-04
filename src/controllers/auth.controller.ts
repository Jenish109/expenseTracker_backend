import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import { handleControllerError } from "../utils/errorHandler";
import logger from "../utils/logger";
import type { LoginDTO, RegisterDTO } from "../interfaces/auth.interface";
import { UserRepository } from "../repositories/user.repository";

export class AuthController {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    // Function to sanitize input
    private sanitizeInput(input: string): string {
        return input.trim().replace(/[<>&;]/g, "");
    }

    /**
     * Register a new user
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            logger.logRequest(req);
            const startTime = Date.now();

            const { username, email, password }: RegisterDTO = req.body;
            
            // Sanitize user input
            const sanitizedData = {
                username: this.sanitizeInput(username),
                email: this.sanitizeInput(email),
                password: password, // Don't sanitize password (we hash it)
            };

            // Validation
            if (!sanitizedData.username) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, ["Username is required"]);
            }
            if (!sanitizedData.email || !/^\S+@\S+\.\S+$/.test(sanitizedData.email)) {
                throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ["Valid email is required"]);
            }
            if (!sanitizedData.password || sanitizedData.password.length < 8) {
                throw new CustomError(ERROR_CODES.USER.INVALID_PASSWORD, ["Password must be at least 8 characters"]);
            }

            // Check if username or email already exists
            const existingUser = await this.userRepository.findByEmailOrUsername(
                sanitizedData.email,
                sanitizedData.username
            );

            if (existingUser) {
                if (existingUser.username === sanitizedData.username) {
                    throw new CustomError(ERROR_CODES.USER.ALREADY_EXISTS, ["Username already exists"]);
                } else {
                    throw new CustomError(ERROR_CODES.USER.ALREADY_EXISTS, ["Email already exists"]);
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(sanitizedData.password, 10);

            // Create user in database
            const user = await this.userRepository.create({
                username: sanitizedData.username,
                email: sanitizedData.email,
                password: hashedPassword
            });

            logger.logPerformance('User Registration', startTime);
            logger.info('User registered successfully', { userId: user.user_id });

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

            const { email = "", password = "", username = "" }: LoginDTO = req.body || {};

            // Validation
            if (!username && !email) {
                throw new CustomError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, ["Either email or username is required"]);
            }
            if (email && !/^\S+@\S+\.\S+$/.test(email)) {
                throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ["Invalid email format"]);
            }
            if (!password || password.length < 8) {
                throw new CustomError(ERROR_CODES.USER.INVALID_PASSWORD, ["Password must be at least 8 characters"]);
            }

            // Find user
            const user = await this.userRepository.findByEmailOrUsername(email, username);

            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, ["Invalid credentials"]);
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                },
                process.env.JWT_SECRET as string,
                { expiresIn: "1h" }
            );

            // Update user token
            await this.userRepository.updateToken(user.user_id, token);

            logger.logPerformance('User Login', startTime);
            logger.info('User logged in successfully', { userId: user.user_id });

            res.status(200).json({
                success: true,
                data: {
                    user_id: user.user_id,
                    email: user.email,
                    token
                },
                message: "Login successful"
            });

        } catch (error) {
            handleControllerError(res, error);
        }
    }
}