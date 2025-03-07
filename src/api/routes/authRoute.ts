import express, { Router } from 'express';
import { login, register } from '../controllers/authContoller';
// import { register, login } from '../controllers/authController';

const authRoute: Router = express.Router();

authRoute.post('/register', register);
authRoute.post('/login', login);

export default authRoute;