#!/bin/bash

# Deployment script for Habit Tracker
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment to VPS..."

# VPS credentials
VPS_HOST="144.124.225.15"
VPS_USER="root"
VPS_DIR="/var/www/habit-tracker"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Connecting to VPS...${NC}"

# SSH into VPS and run deployment commands
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    set -e

    echo "📁 Navigating to project directory..."
    cd /var/www/habit-tracker

    echo "📥 Pulling latest code from git..."
    git pull origin main

    echo "📦 Installing dependencies..."
    npm install --production

    echo "🔄 Restarting application..."
    pm2 restart habit-tracker || pm2 start server/index.js --name habit-tracker --node-args="--max-old-space-size=256"

    echo "💾 Saving PM2 configuration..."
    pm2 save

    echo "✅ Deployment completed successfully!"
ENDSSH

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "🌍 Application is live at: https://tracker.nkudryawov.ru"
