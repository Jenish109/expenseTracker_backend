import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { Pool } from "../utils/types";
import {  CATEGORIES } from '../utils/constants';

dotenv.config();

// Database connection configuration without specifying a database
const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};



// Create database if it doesn't exist
const initializeDatabase = async () => {
  try {
    // Create a connection without specifying a database
    const tempPool = mysql.createPool(connectionConfig);
    const dbName = process.env.DB_NAME;

    if (!dbName) {
      throw new Error("Database name not specified in environment variables");
    }

    console.log(`Checking if database ${dbName} exists...`);

    // Check if database exists
    const [rows] = await tempPool.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    // Create database if it doesn't exist
    if (Array.isArray(rows) && rows.length === 0) {
      console.log(`Database ${dbName} does not exist. Creating it now...`);
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
    await tempPool.end();

    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

const insertCategories = async (pool: mysql.Pool) => {
  try {
    // Fetch existing categories from the database
    const [existingCategories] = await pool.query(
      `SELECT category_name FROM expense_categories`
    ) as any;

    const existingCategoryNames = new Set(existingCategories.map((row: any) => row.category_name));

    // Filter out categories that already exist
    const newCategories = CATEGORIES.filter(category => !existingCategoryNames.has(category.name));

    if (newCategories.length === 0) {
      console.log("All categories already exist. Skipping insert.");
      return;
    }

    await Promise.all(
      newCategories.map(async ({ name, color }) => {
        console.log(`Inserting category: ${name} with color: ${color}`);
        await pool.query(
          `INSERT INTO expense_categories (category_name, category_color) VALUES (?, ?)`,
          [name, color]
        );
      })
    );

    console.log("New categories inserted successfully!");
  } catch (error) {
    console.error("Error inserting categories:", error);
  }
};



// Create MySQL Connection Pool (connects to the correct DB directly)
const createPool = async (): Promise<mysql.Pool> => {
  await initializeDatabase();

  const pool = mysql.createPool({
    ...connectionConfig,
    database: process.env.DB_NAME,
  });

  console.log('Database pool created successfully');

  // await runSchema(); // Ensure schema exists first

  return pool;
};


// Initialize pool
let pool: mysql.Pool;



// Reusable Query Function
const query = async (sql: string, params: any[] = []) => {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(sql, params);
    connection.release();
    return results;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  }
};

// Function to Run `schema.sql`
const runSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, "../models/schemas/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    const statements = schemaSql
      .split(";")
      .filter((stmt: string) => stmt.trim());

    for (const sql of statements) {
      if (sql.trim()) {
        await query(sql); // Execute SQL statements
      }
    }
    await insertCategories(pool); // Insert categories only after schema is applied

    console.log("Schema applied successfully");
  } catch (err) {
    console.error("Error applying schema:", err);
  }
};


// Initialize pool immediately
(async () => {
  try {
    pool = await createPool();
    console.log("Connected to MySQL database");
    await runSchema(); // Run schema after ensuring pool is initialized
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit with error code
  }
})();



// Function to get connection from the pool
const getConnection = async () => {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }
  return pool.getConnection();
};



export { query, pool, getConnection };