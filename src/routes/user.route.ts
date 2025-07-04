import express, { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import verifyToken from '../middlewares/auth.middleware';

const userRoute: Router = express.Router();
const userController = new UserController();

userRoute.post('/add-monthly-data', verifyToken, userController.addMonthlyData.bind(userController));
userRoute.get('/get-dashboard-data', verifyToken, userController.getDashboardData.bind(userController));

export default userRoute;