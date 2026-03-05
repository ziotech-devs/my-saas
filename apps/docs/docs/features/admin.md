---
id: admin
title: Admin (Adminer)
---

# Admin

[Adminer](https://www.adminer.org/) is included for database administration.

## Local Access

Start with Docker Compose, then open: http://localhost:8080

```bash
docker compose -f tools/compose/docker-compose.yml up adminer
```

Login with your PostgreSQL credentials from `.env`.

## Production

The ALB exposes Adminer on port 8080. Restrict access via security groups to trusted IPs only.
