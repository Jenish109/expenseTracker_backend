/** Legacy shared types — prefer Zod-inferred DTOs on new routes. */

export interface ExpenseData {
  expense_id: string;
  category_data: {
    category_id: string;
    category_name: string;
  };
  expense_name: string;
  amount: number;
  created_at: string;
}

export interface DashboardData {
  userId: string;
  monthly_budget: number | null;
  monthly_income: number | null;
  monthly_expense: number | null;
  monthly_savings: number | null;
  recent_transactions: ExpenseData[];
  budget_data: unknown[];
  spending_overview: {
    monthlySpending: Array<{ month: string; amount: number }>;
    categorySpending: Array<{ category_id: string; category_name: string; amount: number }>;
  };
}
