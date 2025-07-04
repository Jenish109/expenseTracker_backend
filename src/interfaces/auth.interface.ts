import { User } from './user.interface';
import { Request } from 'express';

export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
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