import express, { Router } from 'express';
import { addMonthlyData, getDashboardData } from '../controllers/userContoller';
import verifyToken from '../middlewares/user.middleware';

const userRoute: Router = express.Router();

userRoute.post('/addMonthlyData', verifyToken, addMonthlyData);
userRoute.get('/getDashboardData', verifyToken, getDashboardData);


export default userRoute;