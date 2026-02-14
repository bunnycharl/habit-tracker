import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_PATH: process.env.DB_PATH || './data/habits.db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  JWT_SECRET: process.env.JWT_SECRET || 'habit-tracker-secret-key-change-in-production'
};

export const COLORS = {
  MINT: '#6CEFA0',
  BLUE: '#6CDDEF',
  PURPLE: '#B06CEF',
  ORANGE: '#EF9B6C'
};

export const DEFAULT_COLOR = COLORS.MINT;
