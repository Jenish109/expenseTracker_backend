import { ExpenseWithCategory } from './expense.interface';
import { BudgetWithCategory } from './budget.interface';
import { CategorySpending } from './expense.interface';

export interface User {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateUserDTO {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface UpdateUserDTO {
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface UserMonthlyFinance {
    id: number;
    user_id: number;
    period: Date;
    monthly_income: number | null;
    monthly_budget: number | null;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateMonthlyFinanceDTO {
    monthly_income: number;
    monthly_budget: number;
    period: Date;
}

export interface UpdateMonthlyFinanceDTO {
    monthly_income?: number;
    monthly_budget?: number;
    period?: Date;
}

export interface ExpenseData {
    expense_id: number;
    user_id: number;
    category_id: number;
    expense_name: string;
    amount: number;
    description?: string;
    expense_date: Date;
    created_at: Date;
    updated_at?: Date;
    category: {
        category_id: number;
        category_name: string;
        category_color: string;
        user_id: number;
        is_default: boolean;
        created_at: Date;
    };
}

export interface BudgetData {
    budget_id: number;
    category: {
        category_id: number;
        category_name: string;
        category_color: string;
        user_id: number;
        is_default: boolean;
        created_at: Date;
    };
    current_month_spending: number;
    amount: number;
    remaining_amount: number;
    utilization_percentage: number;
    created_at: Date;
}

export interface CategoryData {
    category_id: number;
    category_name: string;
    category_color: string;
    user_id: number;
    is_default: boolean;
    created_at: Date;
}

export interface CategorySpendingData {
    category: CategoryData;
    amount: number;
    percentage: number;
}

export interface RecentTransactionData {
    expense_id: number;
    user_id: number;
    category_id: number;
    expense_name: string;
    amount: number;
    date: Date;
    created_at: Date;
    category: CategoryData;
} 