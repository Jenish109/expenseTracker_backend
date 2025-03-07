import { Request, Response } from "express";
import { pool } from "../../config/database";
import { MESSAGE } from "../../utils/constants";
import { log } from "console";
import { DashboardData } from "../../utils/types";

const addMonthlyData = async (req: any, res: Response) => {
    const userId = req.userId; // Extracted from token

    const { monthly_budget, monthly_income } = req.body || {};

    let response = {
        status: false,
        data: [] as any[],
        message: MESSAGE.USER_DATA_UPDATED,
        response_code: 400,
    }

    try {
        if (!monthly_budget && !monthly_income) {
            return res.status(400).json({ ...response, message: MESSAGE.MONTHLY_BUDGET_AND_INCOME_REQUIRED });
        }
        else if (!monthly_budget) {
            return res.status(400).json({ ...response, message: MESSAGE.MONTHLY_BUDGET_REQUIRED });
        } else if (!monthly_income) {
            return res.status(400).json({ ...response, message: MESSAGE.MONTHLY_INCOME_REQUIRED });
        }

        const [rows] = await pool.query(
            ' UPDATE users SET monthly_budget = (?),monthly_income=(?) WHERE user_id = (?);',
            [monthly_budget, monthly_income, userId]
        );

        return res.status(200).json({
            status: true,
            data: [] as any[],
            message: MESSAGE.USER_DATA_UPDATED,
            response_code: 200,
        });
    } catch (error) {
        console.log('Error adding user data:', error);
        return res.status(500).json({
            status: false,
            data: [] as any[],
            message: MESSAGE.SOMETHING_WENT_WRONG,
            response_code: 500,
        });
    }


}


const getDashboardData = async (req: any, res: Response) => {
    let response = {
        status: false,
        data: [] as any[],
        message: MESSAGE.DASHBOARD_DATA_FETCHED,
        response_code: 400,
    }

    try {
        let total_expense = 0;
        const userId = req.userId; // Extracted from token

        let dashborad_data: DashboardData = {
            userId: userId,
            monthly_budget: null,
            monthly_income: null,
            monthly_expense: 0,
            monthly_savings: null,
            recent_transactions: [],
            budget_data: [],
            spending_overview: {
                monthlySpending: [
                    { month: 'Jan', amount: 0 },
                    { month: 'Feb', amount: 0 },
                    { month: 'Mar', amount: 0 },
                    { month: 'Apr', amount: 0 },
                    { month: 'May', amount: 0 },
                    { month: 'Jun', amount: 0 },
                    { month: 'Jul', amount: 0 },
                    { month: 'Aug', amount: 0 },
                    { month: 'Sep', amount: 0 },
                    { month: 'Oct', amount: 0 },
                    { month: 'Nov', amount: 0 },
                    { month: 'Dec', amount: 0 },
                ],
                categorySpending: []
            }
        }

        const user_data_query = `SELECT monthly_budget,monthly_income FROM users WHERE user_id = ${userId}`;
        const [user_data]: any = await pool.query(user_data_query);

        const recent_transactions = `SELECT * FROM expenses WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5`;
        const [expense_data]: any = await pool.query(recent_transactions);

        let temp_expensedata = [...expense_data];

        const budget_list = `SELECT * FROM budgets WHERE user_id = ?`;
        const [budget_data]: any = await pool.query(budget_list, [userId]);

        const expense_catagories = `SELECT * FROM expense_categories `;
        const [catagories]: any = await pool.query(expense_catagories);

        temp_expensedata.map((item: any) => {
            total_expense += Number(item.amount);  // Use 'amount' instead of 'expense_amount'
        });

        let updated_budget_list = budget_data.map((item: any) => {

            const catagory = catagories.find((catagory: any) => catagory.category_id === item.category_id);
            let current_amount = 0;

            expense_data.forEach((expense: any) => {
                if (expense.category_id === catagory.category_id) {

                    current_amount += Number(expense.amount);
                }
            });
            return {
                budget_id: item.budget_id,
                category_data: {
                    catagory_id: catagory.category_id,
                    category_name: catagory.category_name,
                    category_color: catagory.category_color
                },
                current_amount: current_amount,
                amount: item.amount,
                created_at: item.created_at,
            };
        });

        let categorySpending = catagories.map((catagory: any) => {
            let current_amount = 0;
            expense_data.forEach((expense: any) => {
                if (expense.category_id === catagory.category_id) {
                    current_amount += Number(expense.amount);
                }
            });
            return {
                catagory_id: catagory.category_id,
                category_name: catagory.category_name,
                current_amount: current_amount,
            };
        })

        temp_expensedata.map((item: any) => {
            const date = new Date(item.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            const amount = Number(item.amount);
            const existingMonth = dashborad_data.spending_overview.monthlySpending.find((spending: any) => spending.month === month);
            if (existingMonth) {
                existingMonth.amount += amount;
            } else {
                dashborad_data.spending_overview.monthlySpending.push({ month, amount });
            }
        })

        let recent_transaction = expense_data.map((item: any) => {

            const catagory = catagories.find((catagory: any) => catagory.category_id === item.category_id);
            return {
                expense_id: item.expense_id,
                category_data: {
                    category_id: catagory.category_id,
                    category_name: catagory.category_name,
                    category_color: catagory.category_color
                },
                expense_name: item.expense_name,    
                amount: item.amount,
                created_at: item.created_at,
            };
        });

        if (user_data.length > 0) {
            const { monthly_budget, monthly_income } = user_data[0];
            const income = Number(monthly_income);
            const budget = Number(monthly_budget);
            let savings = (income > budget) ? (income - budget) : 0;
            dashborad_data.monthly_budget = monthly_budget;
            dashborad_data.monthly_income = monthly_income;
            dashborad_data.monthly_expense = total_expense;
            dashborad_data.monthly_savings = savings;
            dashborad_data.budget_data = updated_budget_list;
            dashborad_data.recent_transactions = recent_transaction;
            dashborad_data.spending_overview.categorySpending = categorySpending;

            res.status(200).json({ status: true, response_code: 200, data: dashborad_data, message: MESSAGE.DASHBOARD_DATA_FETCHED });
        }
    } catch (error) {
        res.status(500).json({ ...response, response_code: 500, message: MESSAGE.DASHBOARD_DATA_FETCH_FAILED });
    }
}



export { addMonthlyData, getDashboardData }