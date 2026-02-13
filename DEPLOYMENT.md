# Deployment Guide

This guide covers deploying Habit Tracker to a VPS with automatic GitHub Actions deployment.

## Prerequisites

- VPS with Ubuntu 20.04+ (144.124.225.15)
- Domain configured (tracker.nkudryawov.ru)
- GitHub repository

## Initial VPS Setup

### Option 1: Automated Setup (Recommended)

Run the setup script from your local machine:

```bash
./scripts/setup-vps.sh
```

This will:
- Install Node.js, Nginx, PM2, Certbot
- Configure Nginx reverse proxy
- Set up basic firewall rules

### Option 2: Manual Setup

SSH into your VPS:

```bash
ssh root@144.124.225.15
```

#### 1. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2, Nginx, Certbot
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx git
```

#### 2. Clone Repository

```bash
# Create application directory
mkdir -p /var/www/habit-tracker
cd /var/www/habit-tracker

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/habit-tracker.git .
```

#### 3. Install Application

```bash
# Install dependencies
npm install --production

# Create .env file
cp .env.production .env

# Initialize database
npm run init-db
```

#### 4. Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/habit-tracker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name tracker.nkudryawov.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tracker.nkudryawov.ru;

    # SSL certificates (configured by certbot)
    ssl_certificate /etc/letsencrypt/live/tracker.nkudryawov.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tracker.nkudryawov.ru/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 5. Set Up SSL

```bash
certbot --nginx -d tracker.nkudryawov.ru
```

Follow the prompts to configure SSL.

#### 6. Start Application with PM2

```bash
cd /var/www/habit-tracker
pm2 start server/index.js --name habit-tracker
pm2 startup
pm2 save
```

#### 7. Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## GitHub Actions Setup

### 1. Create GitHub Repository

```bash
# From your local project directory
git add .
git commit -m "Initial commit: Habit Tracker application"
git remote add origin https://github.com/yourusername/habit-tracker.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- `VPS_HOST`: `144.124.225.15`
- `VPS_USERNAME`: `root`
- `VPS_PASSWORD`: `Ty8c5FGqLG695-i9j5V%`

### 3. Enable GitHub Actions

The workflow file is already in `.github/workflows/deploy.yml`.

Every push to `main` branch will automatically deploy to VPS.

## Manual Deployment

If you need to deploy manually without GitHub Actions:

```bash
./scripts/deploy.sh
```

## Common Tasks

### View Application Logs

```bash
pm2 logs habit-tracker
```

### Restart Application

```bash
pm2 restart habit-tracker
```

### Stop Application

```bash
pm2 stop habit-tracker
```

### Check Application Status

```bash
pm2 status
```

### Update Application

```bash
cd /var/www/habit-tracker
git pull origin main
npm install --production
pm2 restart habit-tracker
```

### Backup Database

```bash
cd /var/www/habit-tracker
cp data/habits.db data/habits.db.backup-$(date +%Y%m%d)
```

## Monitoring

### Check if app is running

```bash
curl http://localhost:3000/api/health
```

### Check Nginx status

```bash
systemctl status nginx
```

### Check SSL certificate

```bash
certbot certificates
```

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs habit-tracker --lines 50

# Check if port 3000 is in use
lsof -i :3000

# Restart application
pm2 restart habit-tracker
```

### Nginx errors

```bash
# Check nginx error log
tail -f /var/log/nginx/error.log

# Test nginx configuration
nginx -t
```

### SSL certificate issues

```bash
# Renew certificate manually
certbot renew

# Check certificate expiry
certbot certificates
```

## Security Recommendations

1. **Change default SSH port** (from 22 to custom)
2. **Disable root SSH login** (create a non-root user)
3. **Set up fail2ban** to prevent brute force attacks
4. **Enable automatic security updates**
5. **Regular backups** of database

## Performance Optimization

1. **Enable PM2 cluster mode** for better performance:
   ```bash
   pm2 start server/index.js --name habit-tracker -i max
   ```

2. **Set up Nginx caching** for static assets

3. **Monitor with PM2 Plus** (optional, paid service)

## Support

For issues, check:
- PM2 logs: `pm2 logs habit-tracker`
- Nginx logs: `/var/log/nginx/error.log`
- Application logs: Check console output in PM2

