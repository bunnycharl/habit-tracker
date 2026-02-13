# Quick Start Guide

⚠️ **SECURITY NOTICE**: Never commit passwords or keys to git!

## Быстрая настройка через VNC консоль

Если SSH не работает, выполните через VNC консоль VDSina:

### Вариант 1: Автоматическая настройка (Рекомендуется)

```bash
# Перейдите в директорию проекта и запустите скрипт
cd /var/www/habit-tracker
bash scripts/setup-on-vps.sh
```

Скрипт автоматически:
- ✅ Исправит SSH конфигурацию (разрешит root login)
- ✅ Разблокирует fail2ban
- ✅ Настроит Nginx
- ✅ Установит SSL сертификат

### Вариант 2: Ручная настройка

#### 1. Исправить SSH доступ

```bash
# Разрешить root login с паролем
sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# Разблокировать все IP в fail2ban (если установлен)
fail2ban-client unban --all 2>/dev/null || true
```

#### 2. Настроить Nginx

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 3. Установить SSL

```bash
certbot --nginx -d tracker.nkudryawov.ru --non-interactive --agree-tos --email n.kudryawov@gmail.com
```

## Проверка

После настройки проверьте:
- 🌍 Сайт: https://tracker.nkudryawov.ru
- 🔌 API: https://tracker.nkudryawov.ru/api/health
- 🐳 Docker: `docker ps` (должен быть контейнер habit-tracker)

## SSH доступ

После исправления конфигурации вы сможете подключаться по SSH:
```bash
ssh root@144.124.225.15
```

---

## Диагностика проблем

### Проверить статус приложения
```bash
docker ps --filter name=habit-tracker
docker logs habit-tracker --tail 50
```

### Проверить Nginx
```bash
nginx -t
systemctl status nginx
curl http://localhost:3001/api/health
```

### Проверить SSH конфигурацию
```bash
grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config
```
