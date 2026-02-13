# Quick Start Guide

⚠️ **SECURITY NOTICE**: Never commit passwords or keys to git!

## Application is Already Running!

✅ Your Habit Tracker is deployed and running in Docker
- Container: habit-tracker
- Port: 3001
- Health: http://YOUR_VPS_IP:3001/api/health

## Access VPS

Use VPS provider console or SSH with your credentials.

## Complete Setup

### 1. Add SSH Key (if needed)

```bash
# On VPS (via console)
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2. Configure Nginx

```bash
cat > /etc/nginx/sites-available/habit-tracker << 'NGINX'
server {
    listen 80;
    server_name tracker.nkudryawov.ru;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Set up SSL

```bash
certbot --nginx -d tracker.nkudryawov.ru
```

## Done!

Visit: https://tracker.nkudryawov.ru
