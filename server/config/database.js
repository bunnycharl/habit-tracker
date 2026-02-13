import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/habits.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * Get or create database connection
 * Returns a promisified sqlite3 database
 */
export async function getDatabase() {
  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('📦 Connected to SQLite database at:', DB_PATH);

        // Enable foreign keys
        database.run('PRAGMA foreign_keys = ON');

        // Custom promisification for database methods
        // sqlite3's run() returns result via 'this' context, not callback parameters
        const originalRun = database.run.bind(database);
        const originalGet = database.get.bind(database);
        const originalAll = database.all.bind(database);
        const originalClose = database.close.bind(database);

        database.run = function(...args) {
          return new Promise((resolve, reject) => {
            originalRun(...args, function(err) {
              if (err) reject(err);
              else resolve({ lastID: this.lastID, changes: this.changes });
            });
          });
        };

        database.get = promisify(originalGet);
        database.all = promisify(originalAll);
        database.close = promisify(originalClose);

        db = database;
        resolve(database);
      }
    });
  });
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
}
