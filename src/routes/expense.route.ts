import express, { Router } from 'express';
import verifyToken from '../middlewares/auth.middleware';
import { ExpenseController } from '../controllers/expense.controller';

const expenseRoute: Router = express.Router();
const expenseController = new ExpenseController();

expenseRoute.get('/get-expense-list', verifyToken, expenseController.getAllExpenses.bind(expenseController));

expenseRoute.get('/get-expense/:id', verifyToken, expenseController.getExpenseById.bind(expenseController));

expenseRoute.post('/add-expense', verifyToken, expenseController.createExpense.bind(expenseController));

expenseRoute.put('/update-expense/:id', verifyToken, expenseController.updateExpense.bind(expenseController));

expenseRoute.delete('/delete-expense/:id', verifyToken, expenseController.deleteExpense.bind(expenseController));

export default expenseRoute;