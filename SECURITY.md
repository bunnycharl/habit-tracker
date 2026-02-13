# Security Guidelines

## 🔒 Never Commit These

**NEVER commit to git:**
- Passwords
- API keys
- SSH private keys
- IP addresses (use environment variables)
- Email addresses
- Any personal information

## ✅ How to Handle Sensitive Data

### 1. Environment Variables

Use `.env.local` for local development:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

`.env.local` is gitignored and will never be committed.

### 2. Deployment

For VPS deployment, set environment variables:
```bash
export VPS_HOST=your-vps-ip
export VPS_USER=your-username
./scripts/deploy.sh
```

### 3. GitHub Actions

Use GitHub Secrets (never hardcode):
1. Go to repo Settings → Secrets → Actions
2. Add secrets:
   - `VPS_HOST`
   - `VPS_USERNAME`
   - `VPS_SSH_KEY`

### 4. Production Environment

On VPS, create `/var/www/habit-tracker/.env`:
```bash
PORT=3000
NODE_ENV=production
DB_PATH=./data/habits.db
CORS_ORIGIN=https://your-domain.com
```

## 🛡️ Security Checklist

- [ ] No passwords in code
- [ ] No IP addresses hardcoded
- [ ] `.env.local` in `.gitignore`
- [ ] GitHub Secrets configured
- [ ] SSH keys used (not passwords)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured
- [ ] Regular security updates

## 🚨 If Credentials Leaked

1. **Immediately** change all passwords
2. Rotate API keys
3. Remove from git history: `git filter-branch`
4. Force push: `git push --force`
5. Check GitHub for security alerts
6. Review access logs

## 📚 Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12 Factor App](https://12factor.net/)
