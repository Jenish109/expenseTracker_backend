import { Request, Response } from "express";
import { pool } from "../../config/database";
import { MESSAGE } from "../../utils/constants";
import { log } from "console";
import { ExpenseData } from "../../utils/types";
const getExpenseCatagories = async (req: any, res: Response) => {

    let response = {
        status: false,
        data: [] as any[],
        message: MESSAGE.EXPENSE_CATAGORIES_FETCHED,
        response_code: 400,
    }
    try {
        const expense_catagories = `SELECT * FROM expense_categories `;
        const [catagories]: any = await pool.query(expense_catagories);
        res.status(200).json({ ...response, response_code: 200, data: catagories, message: MESSAGE.EXPENSE_CATAGORIES_FETCHED });
    } catch (error) {
        res.status(500).json({ ...response, response_code: 500, message: MESSAGE.EXPENSE_CATAGORIES_FETCH_FAILED });
    }
}

const addExpenseData = async (req: any, res: Response) => {
    const user_id = req.userId;
    let response = {
        status: false,
        data: [] as any[],
        message: MESSAGE.FAILED_TO_ADD_EXPENSE,
        response_code: 400,
    }
    try {
        const { category_id, expense_amount, description, date } = req.body;

        if (!category_id && !expense_amount && !description) {
            return res.status(400).json({ ...response, message: MESSAGE.EXPENSE_ADD_DESCRIPTON_AMOUNT_CATAGORY_REQUIRED });
        } else if (!category_id) {
            return res.status(400).json({ ...response, message: MESSAGE.SELECT_EXPENSE_CATAGORY });
        } else if (!expense_amount) {
            return res.status(400).json({ ...response, message: MESSAGE.ENTER_EXPENSE_AMOUNT });
        } else if (!description) {
            return res.status(400).json({ ...response, message: MESSAGE.ENTER_EXPENSE_DESCRIPTION });
        }
        else if (!date) {
            return res.status(400).json({ ...response, message: MESSAGE.EXPENSE_DATE_IS_REQUIRED });
        }
        if (Number(expense_amount) <= 0) {
            return res.status(400).json({ ...response, message: MESSAGE.ENTER_VALID_EXPENSE_AMOUNT });
        }

        const insert_query = `INSERT INTO expenses (user_id, category_id, expense_name, amount , date) VALUES (?, ?, ?, ?,?);`;
        const [catagories]: any = await pool.query(insert_query, [user_id, category_id, description, expense_amount, date]);
        res.status(200).json({ ...response, response_code: 200, message: MESSAGE.EXPENSE_ADDED_SUCCESSFULLY });
    } catch (error) {
        console.log('first error', error);
        res.status(500).json({ ...response, response_code: 500, message: MESSAGE.FAILED_TO_ADD_EXPENSE });
    }
}

const getExpenseList = async (req: any, res: Response) => {
    const user_id = req.userId;
    let response = {
        status: false,
        data: Array<ExpenseData>(),
        message: MESSAGE.FAILED_TO_FETCH_EXPENE_LIST,
        response_code: 400,
    }


    try {

        const { catagory_id, page, search } = req.body;

        // Check if page is provided
        if (!page) {
            return res.status(400).json({ ...response, response_code: 400, message: MESSAGE.PAGE_NUMBER_REQUIRED });
        }
        
        const pageSize = 10; // Number of records per page
        const offset = (page - 1) * pageSize; // Calculate the offset based on page number
        let expense_list_data;
        let queryParams;
        
        // Build the query based on provided parameters
        if (search) {
            // If search is provided
            if (catagory_id) {
                // Both search and category filter
                expense_list_data = `SELECT * FROM expenses WHERE user_id = ? AND category_id = ? AND expense_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                queryParams = [req.userId, catagory_id, `%${search}%`, pageSize, offset];
            } else {
                // Only search filter
                expense_list_data = `SELECT * FROM expenses WHERE user_id = ? AND expense_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                queryParams = [req.userId, `%${search}%`, pageSize, offset];
            }
        } else {
            // No search provided
            if (catagory_id) {
                // Only category filter
                expense_list_data = `SELECT * FROM expenses WHERE user_id = ? AND category_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                queryParams = [req.userId, catagory_id, pageSize, offset];
            } else {
                // No filters, just pagination
                expense_list_data = `SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                queryParams = [req.userId, pageSize, offset];
            }
        }

        const [new_expense_data]: any = await pool.query(expense_list_data, queryParams);

        if(new_expense_data.length === 0){
        res.status(200).json({ ...response, response_code: 200, data: [], message: MESSAGE.NO_DATA_FOUND });
        }

        const expense_catagories = `SELECT * FROM expense_categories `;
        const [catagories]: any = await pool.query(expense_catagories);

        let updated_data = new_expense_data.map((item: any) => {
            const catagory = catagories.find((catagory: any) => catagory.category_id === item.category_id);
            return {
                expense_id: item.expense_id,
                category_data: {
                    category_id: catagory.category_id,
                    category_color: catagory.category_color,
                    category_name: catagory.category_name,
                },
                expense_name: item.expense_name,
                amount: item.amount,
                created_at: item.created_at,
            };
        });


        res.status(200).json({ ...response, response_code: 200, data: updated_data, message: MESSAGE.EXPENSE_LIST_FETCHEDD_SUCCESSFULLY });
    } catch (error) {
        res.status(500).json({ ...response, response_code: 500, message: MESSAGE.FAILED_TO_FETCH_EXPENE_LIST });
    }
}

export { getExpenseCatagories, addExpenseData, getExpenseList }