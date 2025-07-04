require('dotenv').config();
const mysql = require('mysql2/promise');

async function resetDatabase() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };

    try {
        // Create connection
        const connection = await mysql.createConnection(config);

        // Drop database if exists
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log('✅ Dropped database');

        // Create database
        await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log('✅ Created database');

        // Close connection
        await connection.end();
        console.log('✅ Database reset complete');
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase(); 