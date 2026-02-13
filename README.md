# Habit Tracker

Data-driven habit tracking application with beautiful minimalist design.

## Features

- ✅ Track daily habits with visual feedback
- 📊 Real-time statistics and analytics
- 🔥 Streak tracking and motivation
- 📅 Year-long heatmap visualization
- 📈 Completion rate and efficiency metrics
- 🎨 Customizable habit colors

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite
- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Styling:** CSS with custom design system

## Local Development

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Create local environment file
cp .env.local.example .env.local
# Edit .env.local with your settings

# Initialize database with sample data
npm run init-db

# Start development server
npm run dev
```

Application will be available at `http://localhost:3000`

**⚠️ Security Note:** Never commit `.env.local` - it's gitignored for your protection.

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run init-db` - Initialize database with schema and sample data

## Production Deployment

### Environment Variables

On your VPS, create `/var/www/habit-tracker/.env`:

```env
PORT=3000
NODE_ENV=production
DB_PATH=./data/habits.db
CORS_ORIGIN=https://your-domain.com
```

**🔒 Important:** Never commit `.env` files to git!

### VPS Deployment

The application uses GitHub Actions for automatic deployment.

**Setup GitHub Secrets:**
1. Go to repo Settings → Secrets → Actions
2. Add: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`

Push to `main` branch to trigger automatic deployment.

**Manual deployment:**
```bash
export VPS_HOST=your-vps-ip
export VPS_USER=your-username
./scripts/deploy.sh
```

## API Documentation

### Habits

- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Archive habit

### Executions

- `GET /api/executions` - Get executions with filters
- `POST /api/executions/toggle` - Toggle habit completion
- `GET /api/executions/habits-status` - Get habits with today's status

### Analytics

- `GET /api/analytics/overview` - Get overall statistics
- `GET /api/analytics/habits/:id/stats` - Get habit statistics
- `GET /api/analytics/heatmap?year=2026` - Get heatmap data
- `GET /api/analytics/streaks` - Get all habit streaks

## Project Structure

```
personal-tracker/
├── server/              # Backend code
│   ├── config/          # Configuration
│   ├── db/              # Database schema and migrations
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── public/              # Frontend static files
│   ├── css/             # Styles
│   ├── js/              # JavaScript modules
│   │   ├── components/  # UI components
│   │   └── utils/       # Frontend utilities
│   └── index.html       # Main HTML
├── data/                # SQLite database
└── package.json         # Dependencies
```

## License

MIT

## 🔒 Security

**See [SECURITY.md](SECURITY.md) for detailed security guidelines.**

Quick rules:
- ✅ Use environment variables for all sensitive data
- ✅ Never commit passwords, keys, or personal info
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use SSH keys instead of passwords
- ❌ Never hardcode IP addresses, emails, or credentials

