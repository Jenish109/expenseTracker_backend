import express, { Router } from 'express';
import verifyToken from '../middlewares/auth.middleware';
import { BudgetController } from '../controllers/budget.controller';

const budgetRoute: Router = express.Router();
const budgetController = new BudgetController();

budgetRoute.get('/get-budget-list', verifyToken, budgetController.getBudgetList.bind(budgetController));

budgetRoute.get('/get-budget/:id', verifyToken, budgetController.getBudgetById.bind(budgetController));

budgetRoute.post('/add-budget', verifyToken, budgetController.addBudget.bind(budgetController));

budgetRoute.put('/update-budget/:id', verifyToken, budgetController.updateBudget.bind(budgetController));

budgetRoute.delete('/delete-budget/:id', verifyToken, budgetController.deleteBudget.bind(budgetController));

export default budgetRoute;