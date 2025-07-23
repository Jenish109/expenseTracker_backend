import express, { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import verifyToken from '../middlewares/auth.middleware';
import { validatePayload } from '../middlewares/validation.middleware';
import { monthlyFinanceSchema } from '../validations/userSchema';
import { deleteAccountSchema } from '../validations/userSchema';

const userRoute: Router = express.Router();
const userController = new UserController();

userRoute.post('/monthly-finance', 
    verifyToken, 
    validatePayload(monthlyFinanceSchema),
    userController.setOrUpdateMonthlyFinance.bind(userController)
);

userRoute.get('/monthly-finance', 
    verifyToken, 
    userController.getMonthlyFinance.bind(userController)
);

userRoute.get('/monthly-finances', 
    verifyToken, 
    userController.getAllMonthlyFinances.bind(userController)
);

userRoute.get('/get-dashboard-data', verifyToken, userController.getDashboardData.bind(userController));

userRoute.get('/history', verifyToken, userController.getUserHistory.bind(userController));

userRoute.delete('/delete-account', 
    verifyToken, 
    validatePayload(deleteAccountSchema),
    userController.deleteAccount.bind(userController)
);

export default userRoute;