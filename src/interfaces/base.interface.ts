export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    status_code: number;
    timestamp: string;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: PaginationMeta;
}

export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}

export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
} 