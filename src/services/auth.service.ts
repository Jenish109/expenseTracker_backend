import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import type { LoginDTO, RegisterDTO } from "../interfaces/auth.interface";
import { UserRepository } from "../repositories/user.repository";
import { UserToken } from "../models";
import logger from "../utils/logger";
import { Op } from "sequelize";

export class AuthService {
    private userRepository: UserRepository;
    private readonly ACCESS_TOKEN_EXPIRY = '7d'; // 7 days
    private readonly REFRESH_TOKEN_EXPIRY = '1y'; // 1 year
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
        expiresAt.setDate(expiresAt.getDate() + 7); 

        // Get count of existing tokens for this user
        const tokenCount = await UserToken.count({
            where: { user_id: userId }
        });

        // If there are more than 5 tokens, remove the oldest ones
        if (tokenCount >= 5) {
            const tokensToKeep = await UserToken.findAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
                limit: 4 // Keep the 4 most recent tokens
            });

            // Get the created_at date of the oldest token to keep
            const oldestTokenDate = tokensToKeep[tokensToKeep.length - 1].created_at;

            // Delete all tokens older than this
            await UserToken.destroy({
                where: {
                    user_id: userId,
                    created_at: {
                        [Op.lt]: oldestTokenDate
                    }
                }
            });
        }

        // Create new token entry
        await UserToken.create({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });

        // Clean up expired tokens
        await this.cleanupExpiredTokens(userId);
    }

    /**
     * Clean up expired tokens for a user
     */
    private async cleanupExpiredTokens(userId: number) {
        const now = new Date();
        await UserToken.destroy({
            where: {
                user_id: userId,
                expires_at: {
                    [Op.lt]: now
                }
            }
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

            // Increment login count
            user.login_count = (user.login_count || 0) + 1;
            await user.save();

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
                username: user.username,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                login_count: user.login_count
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

            // Check if refresh token exists and get the latest one
            const tokenRecord = await UserToken.findOne({
                where: { 
                    user_id: decoded.user_id,
                    refresh_token: refreshToken,
                    expires_at: {
                        [Op.gt]: new Date() // Only get non-expired tokens
                    }
                },
                order: [['created_at', 'DESC']] // Get the latest token
            });

            if (!tokenRecord) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, ["Refresh token has been revoked or expired"]);
            }

            // Generate new tokens
            const tokens = this.generateTokens({
                user_id: decoded.user_id,
                email: decoded.email
            });

            // Save new tokens without deleting old ones
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
        // On logout, invalidate all tokens for the user
        await this.invalidateTokens(userId);
        logger.info('User logged out successfully', { userId });
    }
} 