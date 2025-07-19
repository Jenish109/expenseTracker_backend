import express, { Router } from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import expenseRoute from './expense.route';
import budgetRoute from './budget.route';
import settingsRouter from './settings.route';
import categoryRoute from './category.route';

const router: Router = express.Router();

router.use('/auth', authRoute);
router.use('/user', userRoute);
router.use('/expense', expenseRoute);
router.use('/budget', budgetRoute);
router.use('/settings', settingsRouter);
router.use('/categories', categoryRoute);

export default router;