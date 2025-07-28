import { User } from './user.interface';
import { Request } from 'express';
import { FindOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { UserToken } from '../models/userToken.model';

export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface LoginDTO {
    email?: string;
    username?: string;
    password: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export interface ChangeEmailDTO {
    newEmail: string;
    password: string;
}

export interface JWTPayload {
    user_id: number;
    email: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user: User;
    userId: number;
}

export interface IUserTokenCreate {
    user_id: number;
    access_token?: string;
    refresh_token?: string;
    expires_at?: Date;
}

export interface IUserTokenUpdate {
    access_token?: string;
    refresh_token?: string;
    expires_at?: Date;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    user: any; // Replace 'any' with your User type if available
    emailData: {
        subject: string;
        html: string;
    };
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface GoogleLoginRequest {
    token: string;
    userAgent?: string;
    ipAddress?: string;
}

export interface GoogleLoginResponse {
    user_id: number;
    email: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    loginCount: number;
}

export interface FacebookLoginRequest {
    token: string;
    userAgent?: string;
    ipAddress?: string;
}

export interface FacebookLoginResponse {
    user_id: number;
    email: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    loginCount: number;
}