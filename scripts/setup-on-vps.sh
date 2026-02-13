#!/bin/bash
# Выполните этот скрипт через VNC консоль VDSina
# Скопируйте в терминал VPS и запустите: bash setup-on-vps.sh

set -e

echo "🔧 Настройка Habit Tracker на VPS..."

# 1. Исправить SSH конфигурацию
echo "📝 Настройка SSH для удалённого доступа..."
if grep -q "^PermitRootLogin" /etc/ssh/sshd_config; then
    sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
else
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
fi

if grep -q "^PasswordAuthentication" /etc/ssh/sshd_config; then
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
else
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
fi

# Restart SSH (handle both sshd and ssh service names)
if systemctl restart sshd 2>/dev/null; then
    echo "✅ SSH настроен (root может подключаться с паролем)"
elif systemctl restart ssh 2>/dev/null; then
    echo "✅ SSH настроен (root может подключаться с паролем)"
else
    echo "⚠️  Не удалось перезапустить SSH. Выполните вручную: systemctl restart ssh"
fi

# 2. Разблокировать fail2ban (если установлен)
if systemctl is-active --quiet fail2ban; then
    echo "🔓 Очистка fail2ban..."
    fail2ban-client unban --all || true
    echo "✅ Все IP разблокированы"
fi

# 3. Проверить Docker контейнер
echo "🐳 Проверка Docker контейнера..."
if docker ps | grep -q habit-tracker; then
    echo "✅ Контейнер habit-tracker запущен"
    docker ps --filter name=habit-tracker --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "⚠️  Контейнер не запущен. Нужно развернуть приложение."
fi

# 4. Настроить Nginx
echo "🌐 Настройка Nginx..."
cat > /etc/nginx/sites-available/habit-tracker << 'NGINX_CONFIG'
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
NGINX_CONFIG

# Активировать конфиг
ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
if nginx -t 2>&1; then
    systemctl reload nginx
    echo "✅ Nginx настроен для tracker.nkudryawov.ru"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

# 5. Настроить SSL через Let's Encrypt
echo "🔒 Настройка SSL сертификата..."
if command -v certbot &> /dev/null; then
    certbot --nginx -d tracker.nkudryawov.ru --non-interactive --agree-tos --email n.kudryawov@gmail.com --redirect || {
        echo "⚠️  Не удалось автоматически настроить SSL"
        echo "Выполните вручную: certbot --nginx -d tracker.nkudryawov.ru"
    }
else
    echo "⚠️  certbot не установлен"
    echo "Установите: apt install certbot python3-certbot-nginx"
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Статус:"
echo "  - SSH: root login с паролем разрешён"
echo "  - Nginx: настроен для tracker.nkudryawov.ru"
echo "  - SSL: $(if [ -d /etc/letsencrypt/live/tracker.nkudryawov.ru ]; then echo 'установлен'; else echo 'требует настройки'; fi)"
echo ""
echo "🌍 Проверьте: https://tracker.nkudryawov.ru"
