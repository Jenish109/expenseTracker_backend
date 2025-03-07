import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../../config/database";
import { log } from "console";
import { MESSAGE } from "../../utils/constants";

interface Register {
  username: string;
  email: string;
  password: string;
}

interface Login {
  email: string;
  password: string;
  username: string;
}

// Function to sanitize input
const sanitizeInput = (input: string): string => input.trim().replace(/[<>&;]/g, "");

// Register user function
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password }: Register = req.body;
    // Sanitize user input
    const sanitizedData = {
      username: sanitizeInput(username),
      email: sanitizeInput(email),
      password: password, // Don't sanitize password (we hash it)
    };

    let response = {
      status: false,
      data: [] as any[],
      message: "User registered successfully",
      response_code: 400,
    };

    // ✅ Validation
    if (!sanitizedData.username) {
      return res.status(400).json({ ...response, message: "Username is required" });
    }
    if (!sanitizedData.email || !/^\S+@\S+\.\S+$/.test(sanitizedData.email)) {
      return res
        .status(400)
        .json({ ...response, message: "Valid email is required" });
    }
    if (!sanitizedData.password || sanitizedData.password.length < 8) {
      return res.status(400).json({
        ...response,
        message: "Password must be at least 8 characters",
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(sanitizedData.password, 10);

    const [usernameAlreadyExists] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [sanitizedData.username]
    ) as [any[], any];

    const [emailAlreadyExists] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [sanitizedData.email]
    ) as [any[], any];
    if (usernameAlreadyExists.length > 0) {
      return res
        .status(400)
        .json({ ...response, message: "Username already exists" });
    }
    else if (emailAlreadyExists.length > 0) {
      return res
        .status(400)
        .json({ ...response, message: "Email already exists" });
    }

    // ✅ Insert user into database
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    const values = [sanitizedData.username, sanitizedData.email, hashedPassword];

    const [result] = await pool.query(query, values) as [any, any];

    // ✅ Send success response
    return res.status(200).json({
      status: true,
      data: [],
      message: "User registered successfully",
      response_code: 200,
    });


  } catch (error) {
    // ❌ Error handling
    console.error("Registration error:", error);
    return res.status(500).json({
      response_code: 500,
      data: [] as any[],
      message: "Something went wrong",
      status: false,
    });
  }
};

//User Login Function 
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email = "", password = "", username = "" }: Login = req.body || {};

    let response = {
      status: false,
      data: [] as any[],
      message: MESSAGE.USER_LOGIN_FAILED,
      response_code: 400,
    }
    // ✅ Validation
    if (!username && !email) {
      return res.status(400).json({
        ...response,
        message: MESSAGE.USERNAME_EMAIL_ERROR,
      });
    }
    else if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        status: false,
        data: [] as any[],
        message: MESSAGE.USER_LOGIN_FAILED,
        response_code: 400,
      });
    } else if (!password || password.length < 8) {
      return res.status(400).json({
        status: false,
        data: [] as any[],
        message: MESSAGE.PASSWORD_LENGTH_ERROR,
        response_code: 400,
      });
    }

    // ✅ Check if user exists
    const [user] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    ) as [any[], any];


    if (user.length === 0) {
      return res.status(404).json({
        status: false,
        data: [] as any[],
        message: MESSAGE.USER_NOT_FOUND,
        response_code: 404,
      });
    }

    // ✅ Verify password
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: false,
        data: [] as any[],
        message: MESSAGE.INVALID_PASSWORD,
        response_code: 401,
      });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        user_id: user[0].user_id,
        email: user[0].email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // ✅ update user into database
    const updateUserQuery = `UPDATE users SET token = ? WHERE email = ?`;
    const [updateUserResult] = await pool.query(updateUserQuery, [
      token,
      email,
    ]) as [any[], any];

    return res.status(200).json({
      status: true,
      data: {
        user_id: user[0].user_id,
        email: user[0].email,
        token,
      },
      message: MESSAGE.USER_LOGIN_SUCCESS,
      response_code: 200,
    });


  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      response_code: 500,
      data: [] as any[],
      message: MESSAGE.SOMETHING_WENT_WRONG,
      status: false,
    });
  }
};

export { register, login };