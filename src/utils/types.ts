interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

interface Pool {
    host: string,
    user: string,
    password: string,
    database: string,
    waitForConnections: boolean,
    connectionLimit: number,
    queueLimit: number,
}

interface ExpenseData {
    expense_id: number;
    category_data: {
        catagory_id: number;
        category_name: string;
    };
    expense_name: string;
    amount: number;
    created_at: Date;
}

interface DashboardData {
    userId: number;
    monthly_budget: number | null;
    monthly_income: number | null;
    monthly_expense: number | null;
    monthly_savings: number | null;
    recent_transactions: [],
    budget_data: [],
    spending_overview: {
        monthlySpending: Array<{ month: string; amount: number; }>,
        categorySpending: Array<{ catagory_id: number, catagory_name: string, amount: number }>,
    }
}


export { User, Pool, ExpenseData, DashboardData };