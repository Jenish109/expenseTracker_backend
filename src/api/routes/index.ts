import express, { Router } from 'express';
import authRoute from './authRoute';
import userRoute from './userRoute';
import expesneRoute from './expenseRoute';
import budgetRoute from './budget';
// import authRoute from './authRoute';

const router: Router = express.Router();

router.use('/', authRoute);
router.use('/', userRoute);
router.use('/', expesneRoute);
router.use('/', budgetRoute);

export default router;