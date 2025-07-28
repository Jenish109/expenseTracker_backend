
// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// API Response Messages
export const MESSAGES = {
    // Authentication
    AUTH: {
        REGISTER_SUCCESS: "User registered successfully",
        LOGIN_SUCCESS: "User logged in successfully",
        LOGOUT_SUCCESS: "User logged out successfully",
        INVALID_CREDENTIALS: "Invalid email/username or password",
        USER_ALREADY_EXISTS: "User already exists",
        EMAIL_ALREADY_EXISTS: "Email already exists",
        USERNAME_ALREADY_EXISTS: "Username already exists",
        UNAUTHORIZED: "Access denied. Please login first",
        INVALID_TOKEN: "Invalid or expired token",
        TOKEN_REQUIRED: "Authorization token is required",
        PASSWORD_CHANGED: "Password changed successfully",
        USERNAME_MIN_LENGTH: "Username must be at least 3 characters long",
        USERNAME_MAX_LENGTH: "Username cannot exceed 50 characters",
        USERNAME_REQUIRED: "Username is required",
        INVALID_EMAIL: "Please provide a valid email address",
        EMAIL_REQUIRED: "Email is required",
        PASSWORD_MIN_LENGTH: "Password must be at least 8 characters long",
        PASSWORD_MAX_LENGTH: "Password cannot exceed 100 characters",
        PASSWORD_PATTERN: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        PASSWORD_REQUIRED: "Password is required",
        FIRST_NAME_REQUIRED: "First name is required",
        LAST_NAME_REQUIRED: "Last name is required"
    },

    // Validation
    VALIDATION: {
        REQUIRED_FIELD: (field: string) => `${field} is required`,
        INVALID_EMAIL: "Please provide a valid email address",
        PASSWORD_MIN_LENGTH: "Password must be at least 8 characters long",
        INVALID_PASSWORD_FORMAT: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        USERNAME_MIN_LENGTH: "Username must be at least 3 characters long",
        INVALID_AMOUNT: "Amount must be a positive number",
        INVALID_DATE: "Please provide a valid date",
        INVALID_CATEGORY: "Invalid category selected",
        PAGE_NUMBER_REQUIRED: "Page number is required",
        INVALID_PAGE_NUMBER: "Page number must be a positive integer",
    },

    // User
    USER: {
        PROFILE_UPDATED: "Profile updated successfully",
        PROFILE_FETCH_SUCCESS: "Profile fetched successfully",
        USER_NOT_FOUND: "User not found",
        MONTHLY_DATA_UPDATED: "Monthly budget and income updated successfully",
    },

    // Expenses
    EXPENSE: {
        CREATED: "Expense added successfully",
        UPDATED: "Expense updated successfully",
        DELETED: "Expense deleted successfully",
        LIST_FETCHED: "Expenses fetched successfully",
        NOT_FOUND: "Expense not found",
        CATEGORIES_FETCHED: "Expense categories fetched successfully",
        UNAUTHORIZED_ACCESS: "You don't have permission to access this expense",
    },

    // Budget
    BUDGET: {
        CREATED: "Budget created successfully",
        UPDATED: "Budget updated successfully",
        DELETED: "Budget deleted successfully",
        LIST_FETCHED: "Budgets fetched successfully",
        NOT_FOUND: "Budget not found",
        ALREADY_EXISTS: "Budget already exists for this category",
        UNAUTHORIZED_ACCESS: "You don't have permission to access this budget",
        UPDATE_FAILED: "Failed to update budget",
        CREATE_FAILED: "Failed to create budget",
        DELETE_FAILED: "Failed to delete budget",
        LIST_FETCH_FAILED: "Failed to fetch budget list",
        INVALID_AMOUNT: "Budget amount must be a positive number",
        INVALID_CATEGORY: "Invalid category selected for budget",
        INVALID_DATA: "Invalid budget data provided",
        FETCHED: "Budget fetched successfully",
        FETCH_FAILED: "Failed to fetch budget",
    },

    // Categories
    CATEGORY: {
        CREATED: "Category created successfully",
        UPDATED: "Category updated successfully",
        DELETED: "Category deleted successfully",
        LIST_FETCHED: "Categories fetched successfully",
        NOT_FOUND: "Category not found",
        ALREADY_EXISTS: "Category with this name already exists",
        IN_USE: "Cannot delete category as it's being used in expenses or budgets",
    },

    // Dashboard
    DASHBOARD: {
        DATA_FETCHED: "Dashboard data fetched successfully",
        DATA_FETCH_FAILED: "Failed to fetch dashboard data",
    },

    // General
    GENERAL: {
        SUCCESS: "Operation completed successfully",
        NO_DATA_FOUND: "No data found",
        INTERNAL_ERROR: "Internal server error occurred",
        INVALID_REQUEST: "Invalid request parameters",
        OPERATION_FAILED: "Operation failed",
    },
} as const;

// Default Expense Categories
export const DEFAULT_CATEGORIES = [
    { name: 'Food & Dining', color: '#4CAF50', icon: 'restaurant' },
    { name: 'Transportation', color: '#2196F3', icon: 'directions_car' },
    { name: 'Housing', color: '#9C27B0', icon: 'home' },
    { name: 'Entertainment', color: '#FF9800', icon: 'movie' },
    { name: 'Utilities', color: '#607D8B', icon: 'flash_on' },
    { name: 'Shopping', color: '#E91E63', icon: 'shopping_cart' },
    { name: 'Healthcare', color: '#00BCD4', icon: 'local_hospital' },
    { name: 'Education', color: '#795548', icon: 'school' },
    { name: 'Travel', color: '#FF5722', icon: 'flight' },
    { name: 'Groceries', color: '#8BC34A', icon: 'local_grocery_store' },
    { name: 'Personal Care', color: '#FFC107', icon: 'face' },
    { name: 'Other', color: '#9E9E9E', icon: 'category' },
] as const;

// Environment Variables
export const ENV_VARS = {
    PORT: 'PORT',
    NODE_ENV: 'NODE_ENV',
    JWT_SECRET: 'JWT_SECRET',
    JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
    DB_HOST: 'DB_HOST',
    DB_USER: 'DB_USER',
    DB_PASSWORD: 'DB_PASSWORD',
    DB_NAME: 'DB_NAME',
    DB_PORT: 'DB_PORT',
} as const;

// Default Values
export const DEFAULTS = {
    PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    JWT_EXPIRES_IN: '24h',
    TOKEN_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Regex Patterns
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

// Database Table Names
export const TABLES = {
    USERS: 'users',
    EXPENSES: 'expenses',
    EXPENSE_CATEGORIES: 'expense_categories',
    BUDGETS: 'budgets',
} as const;

// Keep backward compatibility
export const MESSAGE = MESSAGES;

export const CATEGORIES = [
    { name: 'food', color: '#4CAF50' },
    { name: 'transport', color: '#2196F3' },
    { name: 'housing', color: '#9C27B0' },
    { name: 'entertainment', color: '#FF9800' },
    { name: 'utilities', color: '#607D8B' },
    { name: 'shopping', color: '#E91E63' },
    { name: 'health', color: '#00BCD4' },
    { name: 'other', color: '#9E9E9E' },
];

export const AUTH_PROVIDERS = {
    EMAIL: "email",
    GOOGLE: "google",
    FACEBOOK: "facebook",
  };

export type ErrorDetail = {
  status_code: number; // Http status code
  error_code: string; // Custom error code
  message: string;
};

export type SuccessDetail = {
  status_code: number;
  message: string;
};