export interface User {
    user_id: number;
    username: string;
    email: string;
    password?: string; // Optional for responses
    token?: string;
    monthly_budget?: number;
    monthly_income?: number;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateUserDTO {
    username: string;
    email: string;
    monthly_budget?: number;
    monthly_income?: number;
}

export interface UpdateUserProfileDTO {
    username?: string;
    email?: string;
    monthly_budget?: number;
    monthly_income?: number;
} 