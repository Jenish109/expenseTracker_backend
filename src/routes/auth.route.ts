import express, { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePayload } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../validations/authSchema';
import verifyToken from '../middlewares/auth.middleware';

const authRoute: Router = express.Router();
const authController = new AuthController();

authRoute.post('/register', validatePayload(registerSchema), authController.register.bind(authController));
authRoute.post('/login', validatePayload(loginSchema), authController.login.bind(authController));
authRoute.post('/refresh-token', authController.refreshToken.bind(authController));
authRoute.post('/logout', verifyToken, authController.logout.bind(authController));

export default authRoute;