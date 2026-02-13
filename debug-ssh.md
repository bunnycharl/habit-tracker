# Диагностика SSH проблемы

Выполните через VNC консоль:

## 1. Проверить конфигурацию SSH
```bash
grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config
```

Должно быть:
- `PermitRootLogin yes` (или закомментировано)
- `PasswordAuthentication yes`

## 2. Проверить fail2ban блокировку
```bash
# Проверить статус fail2ban
systemctl status fail2ban

# Проверить заблокированные IP
fail2ban-client status sshd
```

## 3. Исправить конфигурацию SSH (если нужно)
```bash
# Отредактировать конфиг
nano /etc/ssh/sshd_config

# Найти и изменить:
PermitRootLogin yes
PasswordAuthentication yes

# Перезапустить SSH
systemctl restart sshd
```

## 4. Разблокировать IP (если заблокирован)
```bash
# Разблокировать мой IP
fail2ban-client set sshd unbanip 46.242.3.166  # или ваш текущий IP

# Или временно остановить fail2ban
systemctl stop fail2ban
```

## 5. Проверить логи SSH
```bash
tail -50 /var/log/auth.log | grep sshd
```
