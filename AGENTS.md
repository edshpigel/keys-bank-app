# KeysBank App — operator mobile / Telegram Mini App

Общие правила: **[`../AGENTS.md`](../AGENTS.md)**.

## Назначение

- **Telegram Mini App** + **PWA** для операторов точек (аналог `lk-keysbank`).
- Домен: **`app.keys-bank.com`**, локально: `http://localhost:3020`.
- Backend: **`/v1/operator/*`** (не WordPress, не `/v1/admin/*`).
- UI: **HeroUI v3**, mobile-first (телефон / планшет).
- Страницы — **client-only** (`"use client"`), без SSR данных; BFF только для cookies/proxy.

## Auth

| Режим | Flow |
|-------|------|
| Telegram | `init_data` → BFF → `POST /v1/operator/telegram/init`; bind → OTP → `POST /v1/operator/telegram/bind` |
| PWA код | `POST /v1/auth/otp/request` → `POST /v1/auth/otp/verify` |
| PWA пароль | `POST /v1/auth/login` |

Доступ только для ролей **`admin`**, **`operator`**, **`partner`** (проверка в BFF).

Cookies: `kb_app_access`, `kb_app_refresh`, `kb_app_role`.

## Env

См. `.env.example`. `TELEGRAM_BOT_TOKEN` — server-only (дублирует backend для ops; валидация init_data на API).

## Деплой

```bash
bash ../scripts/deploy-service.sh app -y
```
