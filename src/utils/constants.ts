import { ALL } from "dns";

export const MESSAGE = {
    USER_NOT_FOUND: "User not found",
    USER_FOUND: "User found",
    USER_DELETED: "User deleted",
    USER_UPDATED: "User updated",
    USER_CREATED: "User created",
    USER_ALREADY_EXISTS: "User already exists",
    USER_LOGIN_SUCCESS: "User logged in successfully",
    USER_LOGIN_FAILED: "User login failed",
    USER_LOGOUT_SUCCESS: "User logged out successfully",
    USER_LOGOUT_FAILED: "User logout failed",
    USER_PASSWORD_CHANGED: "User password changed",
    USER_PASSWORD_CHANGE_FAILED: "User password change failed",
    USER_PASSWORD_CHANGE_SUCCESS: "User password changed successfully",

    //email
    EMAIL_SEND_SUCCESS: "Email sent successfully",
    EMAIL_SEND_FAILED: "Email sent failed",
    EMAIL_SEND_FAILED_USER_NOT_FOUND: "User not found",
    EMAIL_SEND_FAILED_USER_NOT_VERIFIED: "User not verified",
    INVALID_EMAIL: "Invalid email",
    USERNAME_EMAIL_ERROR: "Enter username or email",

    //password 
    PASSWORD_LENGTH_ERROR: "Password must be at least 8 characters",
    INVALID_PASSWORD: "Invalid password",

    //dashboard 
    DASHBOARD_DATA_FETCHED: "Dashboard data fetched",
    DASHBOARD_DATA_FETCH_FAILED: "Dashboard data fetch failed",

    //data
    MONTHLY_BUDGET_REQUIRED: "Monthly budget is required",
    MONTHLY_INCOME_REQUIRED: "Monthly income is required",
    MONTHLY_BUDGET_AND_INCOME_REQUIRED: "Monthly budget and income are required",
    USER_DATA_UPDATED: "User data updated",
    USER_DATA_UPDATED_FAILED: "User data update failed",


    //expense 
    EXPENSE_CATAGORIES_FETCHED: "Expense catagories fetched",
    EXPENSE_CATAGORIES_FETCH_FAILED: "Expense catagories fetch failed",
    EXPENSE_ADDED_SUCCESSFULLY: "Expense added successfully",
    EXPENSE_ADD_DESCRIPTON_AMOUNT_CATAGORY_REQUIRED: "Expense description, amount and catagory are required",
    SELECT_EXPENSE_CATAGORY: "Expense catagory is required",
    NO_DATA_FOUND:"No data found",
    PAGE_NUMBER_REQUIRED: "Page number is required",
    ENTER_EXPENSE_AMOUNT: "Expense amount is required",
    ENTER_EXPENSE_DESCRIPTION: "Expense description is required",
    EXPENSE_DATE_IS_REQUIRED: "Expense date is required",
    FAILED_TO_ADD_EXPENSE: "Failed to add expense",
    FAILED_TO_FETCH_EXPENE_LIST: "Failed to fetch expense list",
    EXPENSE_LIST_FETCHEDD_SUCCESSFULLY: "Expense list fetched successfully",
    ENTER_VALID_EXPENSE_AMOUNT: "Enter valid expense amount",

    //budget
    BUDGET_ADD_AMOUNT_CATAGORY_REQUIRED: "Budget amount and catagory are required",
    SELECT_BUDGET_CATAGORY: "Budget catagory is required",
    ENTER_BUDGET_AMOUNT: "Budget amount is required",
    BUDGET_ADDED_SUCCESSFULLY: "Budget added successfully",
    FAILED_TO_ADD_BUDGET: "Failed to add budget",
    BUDGET_LIST_FETCHEDD_SUCCESSFULLY: "Budget list fetched successfully",
    FAILED_TO_FETCH_BUDGET_LIST: "Failed to fetch budget list",
    ENTER_VALID_BUDGET_AMOUNT: "Enter valid budget amount",
    BUDGET_EDITED_SUCCESSFULLY: 'Budget edited successfully',
    //errors
    SOMETHING_WENT_WRONG: "Something went wrong",
}

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
