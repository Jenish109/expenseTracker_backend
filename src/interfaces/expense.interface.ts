import type { ExpenseCategory } from './category.interface';

export interface Expense {
    expense_id: number;
    user_id: number;
    category_id: number;
    amount: number;
    expense_name: string;
    description: string;
    expense_date: Date;
    created_at: Date;
    updated_at?: Date;
}

export interface ExpenseWithCategory extends Expense {
    category: ExpenseCategory;
}

export interface CreateExpenseDTO {
    category_id: number;
    amount: number;
    expense_name: string;
    description: string;
    expense_date?: Date;
}

export interface UpdateExpenseDTO {
    category_id?: number;
    amount?: number;
    expense_name?: string;
    description?: string;
    expense_date?: Date;
}

export interface ExpenseSummary {
    category_id: number;
    category_name: string;
    category_color: string;
    total_amount: number;
    expense_count: number;
    percentage: number;
}

export interface ExpenseTrend {
    period: string;
    total_amount: number;
    expense_count: number;
}

export interface CategorySpending {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
}

export interface MonthlySpending {
    month: string;
    amount: number;
} 