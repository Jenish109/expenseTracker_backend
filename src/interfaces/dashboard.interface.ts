import { ExpenseWithCategory } from './expense.interface';
import { BudgetWithCategory } from './budget.interface';
import { CategorySpending, MonthlySpending } from './expense.interface';

export interface DashboardData {
    user_id: number;
    monthly_budget: number | null;
    monthly_income: number | null;
    monthly_expense: number;
    monthly_savings: number | null;
    budget_utilization: number;
    recent_transactions: any[];
    budget_data: any[];
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