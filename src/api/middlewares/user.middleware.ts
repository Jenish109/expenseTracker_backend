import { configDotenv } from "dotenv";
import { NextFunction, Request, Response } from "express";
import { stat } from "fs";

const jwt = require('jsonwebtoken');
configDotenv();

function verifyToken(req: any, res: Response, next: NextFunction) {
    const authHeader = req.header('Authorization');

    if (!authHeader) return res.status(401).json({ error: 'Access denied' });

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Corrected order of parameters
        req.userId = decoded.user_id; // Ensure your token contains `user_id`
        next();
    } catch (error) {
        res.status(401).json({ status: false, message: 'Invalid token', response_code: 401 });
    }
};

export default verifyToken;
