import express, { Router } from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import expenseRoute from './expense.route';
import budgetRoute from './budget.route';
import settingsRouter from './settings.route';

const router: Router = express.Router();

router.use('/auth', authRoute);
router.use('/user', userRoute);
router.use('/expense', expenseRoute);
router.use('/budget', budgetRoute);
router.use('/settings', settingsRouter);

export default router;