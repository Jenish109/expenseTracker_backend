import express, { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRoute: Router = express.Router();
const authController = new AuthController();

authRoute.post('/register', authController.register.bind(authController));
authRoute.post('/login', authController.login.bind(authController));

export default authRoute;