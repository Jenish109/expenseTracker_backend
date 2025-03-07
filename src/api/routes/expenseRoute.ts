import express, { Router } from 'express';
import { login, register } from '../controllers/authContoller';
import verifyToken from '../middlewares/user.middleware';
import { addExpenseData, getExpenseCatagories, getExpenseList } from '../controllers/expenseController';
// import { register, login } from '../controllers/authController';

const expesneRoute: Router = express.Router();

expesneRoute.get('/getExpenseCatagories', verifyToken, getExpenseCatagories);
expesneRoute.post('/addExpenseData', verifyToken, addExpenseData);
expesneRoute.post('/getExpenseList', verifyToken, getExpenseList);

export default expesneRoute;