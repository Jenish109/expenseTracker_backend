import { ExpenseWithCategory } from './expense.interface';
import { BudgetWithCategory } from './budget.interface';
import { CategorySpending, MonthlySpending } from './expense.interface';

export interface RecentTransaction {
    expense_id: number;
    user_id: number;
    category_id: number;
    expense_name: string;
    amount: number;
    date: Date;
    created_at: Date;
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

export interface DashboardData {
    user_id: number;
    monthly_budget: number | null;
    monthly_income: number | null;
    monthly_expense: number;
    monthly_savings: number | null;
    budget_utilization: number;
    recent_transactions: RecentTransaction[];
    budget_data: BudgetData[];
    spending_overview: {
        monthly_spending: Array<{
            month: string;
            amount: number;
        }>;
        category_spending: Array<{
            category: {
                category_id: number;
                category_name: string;
                category_color: string;
                user_id: number;
                is_default: boolean;
                created_at: Date;
            };
            amount: number;
            percentage: number;
        }>;
    };
}

export interface SpendingOverview {
    monthly_spending: MonthlySpending[];
    category_spending: CategorySpending[];
} 