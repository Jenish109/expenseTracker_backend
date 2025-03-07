import { Request, Response } from "express";
import { pool } from "../../config/database";
import { MESSAGE } from "../../utils/constants";
import { log } from "console";
import { ExpenseData } from "../../utils/types";


const addEditBudgetData = async (req: any, res: Response) => {
    const user_id = req.userId;
    let response = {
        status: false,
        data: [] as any[],
        message: MESSAGE.FAILED_TO_ADD_BUDGET,
        response_code: 400,
    }
    try {
        const { category_id, budget_amount, } = req.body;

        if (!category_id && !budget_amount) {
            return res.status(400).json({ ...response, message: MESSAGE.BUDGET_ADD_AMOUNT_CATAGORY_REQUIRED });
        } else if (!category_id) {
            return res.status(400).json({ ...response, message: MESSAGE.SELECT_BUDGET_CATAGORY });
        } else if (!budget_amount) {
            return res.status(400).json({ ...response, message: MESSAGE.ENTER_BUDGET_AMOUNT });
        }

        if (Number(budget_amount) <= 0) {
            return res.status(400).json({ ...response, message: MESSAGE.ENTER_VALID_BUDGET_AMOUNT });
        }

        const check_budget = `SELECT * FROM budgets WHERE user_id = ? AND category_id = ?`;
        const [budget_data]: any = await pool.query(check_budget, [user_id, category_id]);


        if (budget_data.length > 0) {
            const check_budget = `UPDATE budgets SET amount = ? WHERE user_id = ? AND category_id = ?`;
            const [budget_data]: any = await pool.query(check_budget, [budget_amount, user_id, category_id]);

            return res.status(200).json({ ...response, response_code: 200, message: MESSAGE.BUDGET_EDITED_SUCCESSFULLY });
        }

        const insert_query = `INSERT INTO budgets (user_id, category_id, amount,start_date,end_date) VALUES (?, ?, ?,?,?);`;
        const [catagories]: any = await pool.query(insert_query, [user_id, category_id, budget_amount, new Date(), new Date()]);
        res.status(200).json({ ...response, response_code: 200, message: MESSAGE.BUDGET_ADDED_SUCCESSFULLY });
    } catch (error) {
        console.log('first error', error);
        res.status(500).json({ ...response, response_code: 500, message: MESSAGE.FAILED_TO_ADD_BUDGET });
    }
}

const getBudgetList = async (req: any, res: Response) => {
    const user_id = req.userId;
    let response = {
        status: false,
        data: [{
            total_budget: 0,
            spent_amount: 0,
            remaining_amount: 0,
            budget_list: []
        }] as any[],
        message: MESSAGE.FAILED_TO_FETCH_BUDGET_LIST,
        response_code: 400,
    }

    let total_expense = 0;
    let remaining_amount = 0;


    try {
        const budget_list = `SELECT * FROM budgets WHERE user_id = ?`;
        const [budget_data]: any = await pool.query(budget_list, [user_id]);

        const expense_catagories = `SELECT * FROM expense_categories `;
        const [catagories]: any = await pool.query(expense_catagories);

        const expense_list = `SELECT * FROM expenses WHERE user_id = ?`;
        const [expense_data]: any = await pool.query(expense_list, [req.userId]);

        const user_data = `SELECT * FROM users WHERE user_id = ?`;
        const [user_details]: any = await pool.query(user_data, [req.userId]);

        expense_data.map((item: any) => {
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
                    category_id: catagory.category_id,
                    category_name: catagory.category_name,
                    category_color: catagory.category_color
                },
                current_amount: current_amount,
                amount: item.amount,
                created_at: item.created_at,
            };
        });


        let final_object_to_be_sent =
        {
            total_budget: Number(user_details[0].monthly_budget),
            spent_amount: total_expense,
            remaining_amount: Number(user_details[0].monthly_budget) >  total_expense ? Number(user_details[0].monthly_budget) - total_expense : 0,
            budget_list: updated_budget_list
        }

        res.status(200).json({ ...response,response_code: 200, data: final_object_to_be_sent, message: MESSAGE.BUDGET_LIST_FETCHEDD_SUCCESSFULLY });
    } catch (error) {
        console.log('first error', error);
        res.status(500).json({ ...response, message: MESSAGE.FAILED_TO_FETCH_BUDGET_LIST });
    }
}

export { addEditBudgetData, getBudgetList }