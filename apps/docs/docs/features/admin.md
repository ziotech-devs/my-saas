---
id: admin
title: Admin (Adminer)
---

# Admin

[Adminer](https://www.adminer.org/) is included for database administration.

## Local Access

Open http://localhost:8080 — Adminer runs as part of `docker compose -f compose.dev.yml up -d`.

If it's not running yet:

```bash
docker compose -f compose.dev.yml up -d adminer
```

Login with your PostgreSQL credentials from `.env`.

## Production

Adminer is protected with HTTP basic auth using the password set in `ADMINER_BASIC_AUTH` in your `.env`.
