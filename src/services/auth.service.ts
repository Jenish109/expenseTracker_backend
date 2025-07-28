import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/errorCodes";
import { CustomError } from "../utils/customError";
import type { ForgotPasswordRequest, ForgotPasswordResponse, GoogleLoginRequest, GoogleLoginResponse, FacebookLoginRequest, FacebookLoginResponse, LoginDTO, RegisterDTO, UpdateProfileRequest } from "../interfaces/auth.interface";
import { UserRepository } from "../repositories/user.repository";
import { UserTokenRepository } from "../repositories/userToken.repository";
import logger from "../utils/logger";
import { Op } from "sequelize";
import { AUTH_PROVIDERS } from "../utils/constants";
import { generateForgotPasswordEmail, generatePasswordChangedEmail, generateVerificationEmail } from "../utils/email";
import EmailVerificationCodeRepository from '../repositories/emailVerficationCode.repository';
import { EmailService } from './email.service';
import crypto from 'crypto';
import { handleServiceError } from "../utils/errorHandler";
import { SUCCESS_CODES } from "../constants/successCodes";
import { PasswordResetRepository } from "../repositories/passwordReset.repository";
import { CategoryService } from "./category.service";
import admin from "../config/firebase";

export class AuthService {
    private userRepository: UserRepository;
    private userTokenRepository: UserTokenRepository;
    private categoryService: CategoryService;
    private readonly ACCESS_TOKEN_EXPIRY = '7d'; // 7 days
    private readonly REFRESH_TOKEN_EXPIRY = '1y'; // 1 year
    private readonly JWT_SECRET: string;
    private readonly JWT_REFRESH_SECRET: string;

    constructor() {
        this.userRepository = new UserRepository();
        this.userTokenRepository = new UserTokenRepository();
        this.categoryService = new CategoryService();

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
            throw new CustomError(ERROR_CODES.AUTH.UNAUTHORIZED, ['Failed to generate authentication tokens']);
        }
    }

    private async saveTokens(userId: number, accessToken: string, refreshToken: string) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Get count of existing tokens for this user
        const tokens = await this.userTokenRepository.findByUserId(userId);
        const tokenCount = tokens.length;

        // If there are more than 5 tokens, remove the oldest ones
        if (tokenCount >= 5) {
            const tokensToKeep = tokens.slice(0, 4); // Keep the 4 most recent tokens
            const oldestTokenDate = tokensToKeep[tokensToKeep.length - 1].created_at;

            // Delete all tokens older than this
            await this.userTokenRepository.delete({
                where: {
                    user_id: userId,
                    created_at: {
                        [Op.lt]: oldestTokenDate
                    }
                }
            });
        }

        // Create new token entry
        await this.userTokenRepository.create({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });

        // Clean up expired tokens
        await this.cleanupExpiredTokens(userId);
    }

    private async cleanupExpiredTokens(userId: number) {
        await this.userTokenRepository.delete({
            where: {
                user_id: userId,
                expires_at: {
                    [Op.lt]: new Date()
                }
            }
        });
    }

    private async invalidateTokens(userId: number) {
        await this.userTokenRepository.deleteByUserId(userId);
    }

    private sanitizeInput(input: string): string {
        return (input || "").trim().replace(/[<>&;]/g, "");
    }

    async register(registerData: RegisterDTO) {
        // Sanitize user input
        const sanitizedData = {
            username: this.sanitizeInput(registerData.username || ""),
            email: this.sanitizeInput(registerData.email || ""),
            password: registerData.password || "",
            first_name: registerData.firstName || "",
            last_name: registerData.lastName || "",
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
            password: hashedPassword,
            first_name: sanitizedData.first_name,
            last_name: sanitizedData.last_name,
            email_verified: false,
            auth_provider: AUTH_PROVIDERS.EMAIL,
        });

        // Create email verification token
        const { token } = await EmailVerificationCodeRepository.createVerificationToken(user.user_id);


        const frontendUrl = process.env.FRONTEND_URL;
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
        const { subject, html } = generateVerificationEmail(verificationLink);

        await EmailService.sendMail({
            to: user.email,
            subject,
            html,
        });

        // Create default categories for the new user
        try {
            await this.categoryService.ensureDefaultCategoriesForUser(user.user_id);
            logger.info('Default categories created for user', { userId: user.user_id });
        } catch (error) {
            logger.error('Failed to create default categories for user', { userId: user.user_id, error });
            // Don't throw error here as user registration should still succeed
        }

        logger.info('User registered successfully', { userId: user.user_id });

        return user;
    }

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


            if (!user.email_verified) {
                throw new CustomError(ERROR_CODES.AUTH.EMAIL_VERIFICATION_FAILED, ['Please verify your email before logging in.']);
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
            throw new CustomError(ERROR_CODES.AUTH.UNAUTHORIZED, ['Login failed. Please try again.']);
        }
    }

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
            const validToken = await this.userTokenRepository.findValidToken(decoded.user_id, refreshToken);

            if (!validToken) {
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

    async logout(userId: number) {
        await this.invalidateTokens(userId);
        logger.info('User logged out successfully', { userId });
    }

    async verifyUserEmail(token: string) {
        try {
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            const verificationCode = await EmailVerificationCodeRepository.findValidToken(hashedToken);

            if (!verificationCode) {
                return null;
            }

            await EmailVerificationCodeRepository.markTokenAsUsed(verificationCode.id);

            const updatedUser = await this.userRepository.updateEmailVerificationStatus(Number(verificationCode.user_id), true);

            return updatedUser;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async forgotPassword(params: ForgotPasswordRequest): Promise<ForgotPasswordResponse | null> {
        try {
            const { email } = params;

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return null;
            }

            const { token } = await PasswordResetRepository.createResetToken(user.user_id);

            const frontendUrl = process.env.FRONTEND_URL;
            const resetLink = `${frontendUrl}/reset-password?token=${token}`;
            const { subject, html } = generateForgotPasswordEmail(resetLink);

            await EmailService.sendMail({
                to: user.email,
                subject,
                html,
            });

            return {
                user,
                emailData: { subject, html }
            };
        } catch (error) {
            handleServiceError(error);
        }
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
            const verificationCode = await PasswordResetRepository.findValidToken(hashedToken);
            if (!verificationCode) {
                return null;
            }

            await PasswordResetRepository.markTokenAsUsed(verificationCode.id);

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            const updatedUser = await this.userRepository.updatePassword(verificationCode.user_id, hashedPassword);
            return updatedUser;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async fetchProfile(userId: number) {
        try {
            const user = await this.userRepository.findById(userId);
            return user;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async updateProfile(userId: number, profileData: UpdateProfileRequest) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }

            const updatedUser = await this.userRepository.updateProfile(profileData, userId);
            return updatedUser;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, ["Current password is incorrect"]);
            }
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await this.userRepository.updatePassword(userId, hashedPassword);

            const { subject, html } = generatePasswordChangedEmail(user.email);
            await EmailService.sendMail({
                to: user.email,
                subject,
                html,
            });
            return true;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async changeEmail(userId: number, newEmail: string, password: string) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, ["Password is incorrect"]);
            }
            // Check if new email is already taken
            const existingUser = await this.userRepository.findByEmail(newEmail);
            if (existingUser && existingUser.user_id !== userId) {
                throw new CustomError(ERROR_CODES.USER.ALREADY_EXISTS, ["Email already exists"]);
            }
            // Update email and set email_verified to false
            await this.userRepository.update({ email: newEmail, email_verified: false }, { where: { user_id: userId } });
            // Send verification email
            const { token } = await EmailVerificationCodeRepository.createVerificationToken(userId);
            const frontendUrl = process.env.FRONTEND_URL;
            const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
            const { subject, html } = generateVerificationEmail(verificationLink);
            await EmailService.sendMail({
                to: newEmail,
                subject,
                html,
            });
            return true;
        } catch (error) {
            handleServiceError(error);
        }
    }

    async googleLogin(params: GoogleLoginRequest): Promise<GoogleLoginResponse> {
        try {
            const { token, userAgent, ipAddress } = params;

            // Verify Google token
            const decodedToken = await admin.auth().verifyIdToken(token);
            if (!decodedToken?.email) {
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, [
                    `Invalid Google token.`
                ]);
            }

            let user = await this.userRepository.findByEmail(decodedToken.email);

            if (!user) {
                user = await this.userRepository.create({
                    email: decodedToken.email,
                    first_name: decodedToken.name || decodedToken.email.split("@")[0],
                    last_name: "",
                    username: decodedToken.email.split("@")[0],
                    email_verified: true,
                    auth_provider: AUTH_PROVIDERS.GOOGLE,
                    password: "",
                });
            }

            // Increment login count
            user.login_count = (user.login_count || 0) + 1;
            await user.save();

            // Generate tokens
            const tokens = this.generateTokens({ user_id: user.user_id, email: user.email });

            // Store tokens
            await this.saveTokens(user.user_id, tokens.accessToken, tokens.refreshToken);

            return {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                loginCount: user.login_count
            };
        } catch (error) {
            handleServiceError(error);
        }
    }

    async facebookLogin(params: FacebookLoginRequest): Promise<FacebookLoginResponse> {
        try {
            const { token, userAgent, ipAddress } = params;

            // Debug: Log token type and length
            logger.info(`Facebook login attempt with token length: ${token?.length || 0}`);
            logger.info(`Token starts with: ${token?.substring(0, 20)}...`);
            
            // Verify Facebook token using Firebase Admin SDK
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
                logger.info('Firebase token verification successful');
                logger.info('Decoded token email:', decodedToken.email);
                logger.info('Decoded token name:', decodedToken.name);
                logger.info('Decoded token keys:', Object.keys(decodedToken));
            } catch (firebaseError: any ) {
                logger.error('Firebase token verification failed:', firebaseError);
                throw new CustomError(ERROR_CODES.AUTH.INVALID_TOKEN, [
                    `Invalid Facebook token: ${firebaseError.message}`
                ]);
            }
            
            if (!decodedToken?.email) {
                // Facebook might not provide email, try to use user ID or other identifier
                logger.warn('No email found in Facebook token, using user ID as fallback');
                const fallbackEmail = `${decodedToken.uid}@facebook.com`;
                logger.info('Using fallback email:', fallbackEmail);
                
                // Check if user exists with fallback email
                let user = await this.userRepository.findByEmail(fallbackEmail);
                
                if (!user) {
                    user = await this.userRepository.create({
                        email: fallbackEmail,
                        first_name: decodedToken.name || 'Facebook',
                        last_name: "User",
                        username: decodedToken.uid,
                        email_verified: true,
                        auth_provider: AUTH_PROVIDERS.FACEBOOK,
                        password: "",
                    });
                }
                
                // Continue with the rest of the logic
                user.login_count = (user.login_count || 0) + 1;
                await user.save();
                
                const tokens = this.generateTokens({ user_id: user.user_id, email: user.email });
                await this.saveTokens(user.user_id, tokens.accessToken, tokens.refreshToken);
                
                return {
                    user_id: user.user_id,
                    email: user.email,
                    username: user.username,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    loginCount: user.login_count
                };
            }

            let user = await this.userRepository.findByEmail(decodedToken.email);

            if (!user) {
                user = await this.userRepository.create({
                    email: decodedToken.email,
                    first_name: decodedToken.name || decodedToken.email.split("@")[0],
                    last_name: "",
                    username: decodedToken.email.split("@")[0],
                    email_verified: true,
                    auth_provider: AUTH_PROVIDERS.FACEBOOK,
                    password: "",
                });
            }

            // Increment login count
            user.login_count = (user.login_count || 0) + 1;
            await user.save();

            // Generate tokens
            const tokens = this.generateTokens({ user_id: user.user_id, email: user.email });

            // Store tokens
            await this.saveTokens(user.user_id, tokens.accessToken, tokens.refreshToken);

            return {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                loginCount: user.login_count
            };
        } catch (error) {
            handleServiceError(error);
        }
    }
} 
