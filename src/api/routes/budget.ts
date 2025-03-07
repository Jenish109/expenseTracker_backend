import express, { Router } from 'express';
import verifyToken from '../middlewares/user.middleware';
import { addEditBudgetData, getBudgetList } from '../controllers/budgetController';

const budgetRoute: Router = express.Router();

budgetRoute.post('/addEditBudgetData', verifyToken, addEditBudgetData);
budgetRoute.get('/getBudgetList', verifyToken, getBudgetList);


export default budgetRoute;