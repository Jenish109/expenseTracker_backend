import express, { Router } from 'express';
import verifyToken from '../middlewares/auth.middleware';
import { ExpenseController } from '../controllers/expense.controller';
import { validatePayload } from '../middlewares/validation.middleware';
import { createExpenseSchema, updateExpenseSchema } from '../validations/expenseSchema';

const expenseRoute: Router = express.Router();
const expenseController = new ExpenseController();

// Expense routes
expenseRoute.get('/get-expense-list', verifyToken, expenseController.getAllExpenses.bind(expenseController));

expenseRoute.get('/get-expense/:id', verifyToken, expenseController.getExpenseById.bind(expenseController));

expenseRoute.post('/add-expense', 
    verifyToken, 
    validatePayload(createExpenseSchema),
    expenseController.createExpense.bind(expenseController)
);

expenseRoute.put('/update-expense/:id', 
    verifyToken, 
    validatePayload(updateExpenseSchema),
    expenseController.updateExpense.bind(expenseController)
);

expenseRoute.delete('/delete-expense/:id', verifyToken, expenseController.deleteExpense.bind(expenseController));

export default expenseRoute;