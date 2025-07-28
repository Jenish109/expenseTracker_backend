import { ExpenseCategory } from './category.interface';

export interface Budget {
    budget_id: number;
    user_id: number;
    category_id: number;
    amount: number;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateBudgetDTO {
    amount: number;
    categoryId: number;
    startDate: string;
    endDate: string;
}

export interface UpdateBudgetDTO {
    amount: number;
    categoryId?: number;
    startDate: string;
    endDate: string;
}

export interface BudgetWithCategory extends Budget {
    category: ExpenseCategory;
    current_month_spending: number;
    remaining_amount: number;
    utilization_percentage: number;
} 