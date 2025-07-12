import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import type { LoginDTO, RegisterDTO } from "../interfaces/auth.interface";
import { UserRepository } from "../repositories/user.repository";
import { UserToken } from "../models";
import logger from "../utils/logger";

export class AuthService {
    private userRepository: UserRepository;
    private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
    private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
    private readonly JWT_SECRET: string;
    private readonly JWT_REFRESH_SECRET: string;

    constructor() {
        this.userRepository = new UserRepository();
        
        // Check for required environment variables
        if (!process.env.JWT_SECRET) {
            logger.error('JWT_SECRET is not set in environment variables');
            throw new Error('JWT_SECRET must be set in environment variables');
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            logger.error('JWT_REFRESH_SECRET is not set in environment variables');
            throw new Error('JWT_REFRESH_SECRET must be set in environment variables');
        }
        
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    }

    private generateTokens(payload: { user_id: number; email: string }) {
        try {
            const accessToken = jwt.sign(
                payload,
                this.JWT_SECRET,
                { expiresIn: this.ACCESS_TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
                { ...payload, type: 'refresh' },
                this.JWT_REFRESH_SECRET,
                { expiresIn: this.REFRESH_TOKEN_EXPIRY }
            );

            return { accessToken, refreshToken };
        } catch (error) {
            logger.error('Error generating tokens:', error);
            throw new CustomError(ERROR_CODES.AUTH.TOKEN_GENERATION_FAILED, ['Failed to generate authentication tokens']);
        }
    }

    private async saveTokens(userId: number, accessToken: string, refreshToken: string) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        await UserToken.create({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });
    }

    private async invalidateTokens(userId: number) {
        await UserToken.destroy({ where: { user_id: userId } });
    }

    // Function to sanitize input
    private sanitizeInput(input: string): string {
        return (input || "").trim().replace(/[<>&;]/g, "");
    }

    /**
     * Register a new user
     */
    async register(registerData: RegisterDTO) {
        // Sanitize user input
        const sanitizedData = {
            username: this.sanitizeInput(registerData.username || ""),
            email: this.sanitizeInput(registerData.email || ""),
            password: registerData.password || "", // Don't sanitize password (we hash it)
        };

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

        logger.info('User registered successfully', { userId: user.user_id });

        return user;
    }

    /**
     * User Login
     */
    async login(loginData: LoginDTO) {
        try {
            // Find user
            const user = await this.userRepository.findByEmailOrUsername(
                loginData.email || "",
                loginData.username || ""
            );

            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
            if (!isPasswordValid) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, ["Invalid credentials"]);
            }

            // Generate tokens
            const tokens = this.generateTokens({
                user_id: user.user_id,
                email: user.email,
            });

            // Save tokens
            await this.invalidateTokens(user.user_id); // Remove old tokens
            await this.saveTokens(user.user_id, tokens.accessToken, tokens.refreshToken);

            logger.info('User logged in successfully', { userId: user.user_id });

            return {
                user_id: user.user_id,
                email: user.email,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken
            };
        } catch (error) {
            logger.error('Login error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ERROR_CODES.AUTH.LOGIN_FAILED, ['Login failed. Please try again.']);
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as {
                user_id: number;
                email: string;
                type: string;
            };

            if (decoded.type !== 'refresh') {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ["Invalid refresh token"]);
            }

            // Check if refresh token is still valid in database
            const tokenRecord = await UserToken.findOne({
                where: { user_id: decoded.user_id, refresh_token: refreshToken }
            });

            if (!tokenRecord) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ["Refresh token has been revoked"]);
            }

            // Generate new tokens
            const tokens = this.generateTokens({
                user_id: decoded.user_id,
                email: decoded.email
            });

            // Update tokens
            await this.invalidateTokens(decoded.user_id);
            await this.saveTokens(decoded.user_id, tokens.accessToken, tokens.refreshToken);

            return {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new CustomError(ERROR_CODES.AUTH.TOKEN_EXPIRED, ["Refresh token has expired"]);
            }
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout(userId: number) {
        await this.invalidateTokens(userId);
        logger.info('User logged out successfully', { userId });
    }
} 