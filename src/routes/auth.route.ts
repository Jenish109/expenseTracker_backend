import express, { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePayload } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validations/authSchema';
import verifyToken from '../middlewares/auth.middleware';

const authRoute: Router = express.Router();
const authController = new AuthController();

authRoute.post('/register', validatePayload(registerSchema), authController.register.bind(authController));
authRoute.post('/login', validatePayload(loginSchema), authController.login.bind(authController));
authRoute.post('/refresh-token', authController.refreshToken.bind(authController));
authRoute.post('/logout', verifyToken, authController.logout.bind(authController));
authRoute.put('/verify-email', authController.verifyUserEmail.bind(authController));

authRoute.post("/forgot-password", validatePayload(forgotPasswordSchema), authController.forgotPassword.bind(authController));
authRoute.post(
    "/reset-password",
    validatePayload(resetPasswordSchema),
    authController.resetPassword.bind(authController)
);

export default authRoute;