# Quick Deploy Guide

## 🚀 Быстрая настройка автодеплоя

### 1️⃣ GitHub Secrets (1 минута)

Добавьте в репозиторий `Settings → Secrets → Actions`:

```
SERVER_HOST = IP вашего VPS (например: 123.45.67.89)
SERVER_USER = SSH пользователь (обычно root)
SERVER_PASSWORD = SSH пароль
```

### 2️⃣ Подготовка VPS (5 минут)

```bash
# SSH на VPS
ssh root@ваш-ip

# Установить Docker и Git
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install docker-compose-plugin git -y

# Создать директорию
mkdir -p /opt/personal-tracker
cd /opt/personal-tracker
git clone https://github.com/nkudryawov/personal-tracker.git .
mkdir -p data

# Авторизоваться в GHCR (создайте токен на github.com/settings/tokens)
echo "ВАШИЙ_GITHUB_TOKEN" | docker login ghcr.io -u nkudryawov --password-stdin

# Первый запуск
docker compose pull
docker compose up -d
```

### 3️⃣ Готово! 🎉

Теперь при каждом пуше в `main`:
1. GitHub Actions соберет Docker образ
2. Запушит его в GHCR
3. Автоматически деплоит на VPS

### Проверка работы

```bash
# Проверить статус
docker compose ps

# Логи
docker compose logs -f

# Открыть в браузере
http://ваш-ip:3001
```

### Nginx + SSL (опционально)

```bash
# Установить Nginx и Certbot
apt install nginx certbot python3-certbot-nginx -y

# Создать конфиг
cat > /etc/nginx/sites-available/tracker << 'NGINX'
server {
    listen 80;
    server_name tracker.nkudryawov.ru;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

# Активировать
ln -s /etc/nginx/sites-available/tracker /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL сертификат
certbot --nginx -d tracker.nkudryawov.ru
```

### Полезные команды

```bash
# Перезапустить
docker compose restart

# Обновить вручную
git pull && docker compose pull && docker compose up -d

# Посмотреть логи
docker compose logs -f

# Бэкап БД
cp data/habits.db data/habits.db.backup
```

---

**Готово!** Теперь просто пушьте в `main` и деплой произойдет автоматически.
