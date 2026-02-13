# Security Recovery Guide

## What Happened

⚠️ **VPS credentials were accidentally committed to GitHub**
✅ **Immediate actions taken:**
- Removed sensitive files from repository
- Cleaned git history
- Force pushed to remove compromised data
- Changed VPS root password automatically

## Current Status

✅ **Application is running:**
- Docker container is up at http://144.124.225.15:3001
- Health check: http://144.124.225.15:3001/api/health

🔐 **Access issue:**
- Root password has been changed for security
- Need to set up SSH key authentication

## Steps to Restore Access

### Option 1: Using VPS Provider Console

1. Log into your VPS provider control panel
2. Access the server console/terminal
3. Run these commands:

```bash
# Add SSH public key
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Copy this public key to the server:
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCg4/KLAzND7SPdIVRZLmaarEzBaG8G2R+zjAKUKI2nKpz5ShqudzJDl+9cRwWYRHBu2faPQtqhfgmBAGeQJaOvd2j36ZXRxgxIDghGYjIH+NN+zpYBW0iAxPI6+fgkI2D1i0Zjg/ZgNAs9NoOEemKuIc1wWtZijClNWSfE/GUZ3q7rnoOHlDxt6Ot+X6joCgvFNxRT6SnrVQTf0Owoswitg9UlyY5yXxGVm4G7TqH3+MNraRzb2cTKFJ9yJ1nAPBX4tK86Av/YIZNOe/O1sFGGMrBZN1g1RJwY60bO9/DOiyrTMBpgPZiPVyhFxeCX3bUvXHui/rrUAbWym7foDddeWJX9b41dCH3IUDjTan+Ud/QzexJrf8T9fEdUJf46t2OsiCorWuTHsRV2dGBSG/0v2Hshm1cMQI50aCsya00PqLPmFPBLXwEWvJFSDmD5xz7EvAzIM4dLl2NCzlhkMiHvx9HnC6HKOVIxfTLv/chZNjQ9KHdNOftZEMuUFQhD+OzL7pv0xkPiWvrAeHx4fm59aFrz8WddLgV2egPA85/+TAVqA9flKtOX6xT5W8u/z+130mM/GgmUVWQY0UrtUQb4UO4Rxpfq7ClU2ql/34xwSJ7icBPlW+Vz6cEX7kKXNP7JN3MNo3dBTEMeC6kr72Sh6Vk607NVIaHHPZSp1mw7tw== habit-tracker-deploy" >> /root/.ssh/authorized_keys

chmod 600 /root/.ssh/authorized_keys

echo "✅ SSH key added!"
```

4. Test SSH connection from your local machine:
```bash
ssh root@144.124.225.15
```

### Option 2: Reset Password via Provider

1. Use VPS provider's password reset feature
2. Set a new secure password
3. Then add SSH key manually (see Option 1, step 3)

## Complete Nginx Setup

Once you have SSH access, run these commands:

```bash
# Configure Nginx
cat > /etc/nginx/sites-available/habit-tracker << 'EOF'
server {
    listen 80;
    server_name tracker.nkudryawov.ru;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx

# Set up SSL
certbot --nginx -d tracker.nkudryawov.ru --non-interactive --agree-tos -m your-email@example.com
```

## Update GitHub Secrets

After SSH key is set up, update GitHub secrets:

1. Go to: https://github.com/bunnycharl/habit-tracker/settings/secrets/actions

2. Delete the old `VPS_PASSWORD` secret

3. Add new secret `VPS_SSH_KEY`:
   - Copy content of `~/.ssh/id_rsa` (private key)
   - Paste as value

4. Update deployment workflow to use SSH key (already done)

## Verify Deployment

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f

# Test API
curl http://localhost:3001/api/health

# Test via domain (after Nginx + SSL)
curl https://tracker.nkudryawov.ru/api/health
```

## Security Recommendations Going Forward

1. ✅ **Never commit sensitive data** (passwords, keys, tokens)
2. ✅ **Use SSH keys** instead of passwords
3. ✅ **Store secrets** in GitHub Secrets, not in code
4. ✅ **Use .env files** that are gitignored
5. ✅ **Enable 2FA** on GitHub
6. ✅ **Regular security audits** with tools like GitGuardian

## Private Key Location

Your SSH private key is stored at:
```
~/.ssh/id_rsa
```

**NEVER share this file or commit it to git!**

## Questions?

If you need help, check:
- Application logs: `docker compose logs habit-tracker`
- Nginx logs: `/var/log/nginx/error.log`
- GitHub Actions: https://github.com/bunnycharl/habit-tracker/actions

