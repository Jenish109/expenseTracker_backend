import express, { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import verifyToken from '../middlewares/auth.middleware';
import { validatePayload } from '../middlewares/validation.middleware';
import { monthlyDataSchema } from '../validations/userSchema';
import { deleteAccountSchema } from '../validations/userSchema';

const userRoute: Router = express.Router();
const userController = new UserController();

userRoute.post('/add-monthly-data', 
    verifyToken, 
    validatePayload(monthlyDataSchema),
    userController.addMonthlyData.bind(userController)
);

userRoute.get('/get-dashboard-data', verifyToken, userController.getDashboardData.bind(userController));

userRoute.delete('/delete-account', 
    verifyToken, 
    validatePayload(deleteAccountSchema),
    userController.deleteAccount.bind(userController)
);

export default userRoute;