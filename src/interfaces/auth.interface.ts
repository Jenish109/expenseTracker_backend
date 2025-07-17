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
    current_password: string;
    new_password: string;
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