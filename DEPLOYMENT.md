# Deployment Guide - Personal Habit Tracker

## GitHub Actions Auto-Deploy Setup

Этот проект использует автоматический деплой через GitHub Actions при пуше в ветку `main`.

### Workflow Process

1. **Build**: При пуше в `main`, GitHub Actions собирает Docker образ и пушит его в GitHub Container Registry (GHCR)
2. **Deploy**: После успешной сборки, автоматически деплоится на VPS через SSH

### Required GitHub Secrets

В настройках репозитория (`Settings → Secrets and variables → Actions`) должны быть настроены следующие secrets:

- `SERVER_HOST` - IP адрес или домен VPS (например: `123.45.67.89` или `tracker.nkudryawov.ru`)
- `SERVER_USER` - SSH пользователь на VPS (обычно `root` или ваш username)
- `SERVER_PASSWORD` - SSH пароль (рекомендуется использовать SSH ключи вместо пароля)

### VPS Setup Instructions

#### 1. Подготовка VPS

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo apt install docker-compose-plugin -y

# Добавить пользователя в группу docker (опционально)
sudo usermod -aG docker $USER
```

#### 2. Создать директорию для приложения

```bash
# Создать директорию
sudo mkdir -p /opt/personal-tracker

# Клонировать репозиторий
cd /opt/personal-tracker
sudo git clone https://github.com/nkudryawov/personal-tracker.git .

# Создать директорию для данных
mkdir -p data
```

#### 3. Авторизация в GitHub Container Registry

```bash
# Создать Personal Access Token в GitHub:
# Settings → Developer settings → Personal access tokens → Generate new token
# Разрешения: read:packages

# Авторизоваться в GHCR
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u nkudryawov --password-stdin
```

#### 4. Настроить окружение

```bash
# Создать .env файл (если нужно)
cat > .env << 'ENVFILE'
PORT=3000
NODE_ENV=production
DB_PATH=/app/data/habits.db
CORS_ORIGIN=https://tracker.nkudryawov.ru
ENVFILE
```

#### 5. Первый запуск

```bash
# Запустить приложение
docker compose up -d

# Проверить статус
docker compose ps

# Проверить логи
docker compose logs -f
```

#### 6. Настроить Nginx (опционально)

Если используете Nginx как reverse proxy:

```nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 7. SSL сертификат (опционально)

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить сертификат
sudo certbot --nginx -d tracker.nkudryawov.ru
```

### Автоматический Деплой

После настройки VPS, деплой происходит автоматически:

1. Сделайте изменения в коде
2. Закоммитьте и запушьте в ветку `main`
3. GitHub Actions:
   - Соберет новый Docker образ
   - Запушит его в GHCR
   - Подключится к VPS по SSH
   - Скачает новый образ
   - Перезапустит контейнер

### Мониторинг

```bash
# Проверить статус контейнера
docker compose ps

# Посмотреть логи
docker compose logs -f habit-tracker

# Проверить использование ресурсов
docker stats

# Проверить health status
docker inspect --format='{{.State.Health.Status}}' habit-tracker
```

### Откат к предыдущей версии

```bash
# Посмотреть доступные теги образов
docker images ghcr.io/nkudryawov/personal-tracker

# Откатиться на конкретный коммит (SHA)
docker pull ghcr.io/nkudryawov/personal-tracker:sha-abc123

# Изменить docker-compose.yml и указать нужный тег
docker compose down
docker compose up -d
```

### Troubleshooting

#### Проблема: GitHub Actions не может запушить образ

```bash
# Решение: Включить Package write permissions
# Settings → Actions → General → Workflow permissions → Read and write permissions
```

#### Проблема: SSH подключение не работает

```bash
# Проверить firewall на VPS
sudo ufw status
sudo ufw allow ssh

# Проверить SSH сервис
sudo systemctl status ssh
```

#### Проблема: Контейнер не запускается

```bash
# Посмотреть логи
docker compose logs habit-tracker

# Проверить healthcheck
docker inspect habit-tracker | grep -A 10 Health

# Перезапустить
docker compose restart
```

### Backup

```bash
# Создать бэкап базы данных
cp data/habits.db data/habits.db.backup

# Автоматический бэкап (добавить в crontab)
0 2 * * * cp /opt/personal-tracker/data/habits.db /opt/personal-tracker/data/habits.db.$(date +\%Y\%m\%d)
```

### Обновление вручную

Если нужно обновить без GitHub Actions:

```bash
cd /opt/personal-tracker
git pull origin main
docker compose pull
docker compose down --remove-orphans
docker compose up -d
docker image prune -f
```

---

## Security Notes

1. **Не коммитьте секреты** в репозиторий (.env файлы в .gitignore)
2. **Используйте SSH ключи** вместо паролей для GitHub Secrets
3. **Настройте firewall** на VPS (разрешить только нужные порты)
4. **Регулярно обновляйте** Docker и систему
5. **Используйте HTTPS** с Let's Encrypt сертификатом

## Полезные команды

```bash
# Посмотреть все запущенные контейнеры
docker ps

# Посмотреть использование места
docker system df

# Очистить неиспользуемые образы
docker image prune -a

# Полная очистка Docker
docker system prune -a --volumes

# Перезапустить контейнер
docker compose restart habit-tracker

# Остановить все
docker compose down

# Запустить заново
docker compose up -d
```
