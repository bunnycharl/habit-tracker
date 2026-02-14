import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config/constants.js';
import { getDatabase } from './config/database.js';

// Import routes
import habitsRouter from './routes/habits.js';
import executionsRouter from './routes/executions.js';
import analyticsRouter from './routes/analytics.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
}));
app.use(compression());
app.use(cors({
  origin: CONFIG.CORS_ORIGIN
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Auth routes (no middleware)
app.use('/api/auth', authRouter);

// Protected API routes
app.use('/api/habits', authMiddleware, habitsRouter);
app.use('/api/executions', authMiddleware, executionsRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: CONFIG.NODE_ENV
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(CONFIG.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    const db = await getDatabase();

    // Auto-migrate: create users table if not exists
    await db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed users if empty
    const existingUsers = await db.all('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const users = [
        { username: 'allodasha', pin: '0880' },
        { username: 'bunnycharl', pin: '2403' }
      ];
      for (const user of users) {
        const pinHash = await bcrypt.hash(user.pin, 10);
        await db.run('INSERT INTO users (username, pin_hash) VALUES (?, ?)', [user.username, pinHash]);
      }
      console.log('👤 Users seeded: allodasha, bunnycharl');
    }

    // Start listening
    app.listen(CONFIG.PORT, () => {
      console.log('\n🎯 Habit Tracker Server');
      console.log('========================');
      console.log(`🌍 Server: http://localhost:${CONFIG.PORT}`);
      console.log(`📊 API: http://localhost:${CONFIG.PORT}/api`);
      console.log(`🔧 Environment: ${CONFIG.NODE_ENV}`);
      console.log('========================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  const { closeDatabase } = await import('./config/database.js');
  await closeDatabase();
  process.exit(0);
});
