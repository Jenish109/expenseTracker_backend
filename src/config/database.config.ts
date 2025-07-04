import dotenv from 'dotenv';
dotenv.config();

export interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: string;
  logging: boolean;
  migrationStorageTableName?: string;
}

export interface Config {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const config: Config = {
  development: {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    dialect: 'mysql',
    logging: false,
    migrationStorageTableName: 'sequelize_meta'
  },
  test: {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || '',
    host: process.env.DB_HOST || '',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    dialect: 'mysql',
    logging: false
  }
};

export default config; 