---
id: vps
title: VPS (Self-Hosted)
---

# VPS Deployment (Self-Hosted)

Deploy the full stack on a single VPS using Docker Compose + Traefik for TLS termination and automatic Let's Encrypt certificates.

**Compose file:** `tools/compose/vps.yml`
**Env file:** `tools/compose/.env.vps`

## Services

| Service | Description |
|---|---|
| Traefik | Reverse proxy, TLS termination, HTTP→HTTPS redirect |
| server | NestJS API + built React client |
| graphs | LangGraph AI agent service |
| postgres | PostgreSQL 16 |
| langgraph-redis | Redis (LangGraph checkpointer) |
| adminer | DB admin UI (protected by basic auth) |

> MinIO and Chrome (PDF printer) are **not** deployed in this setup. Dummy env values prevent startup errors.

## Prerequisites

- A VPS with Docker + Docker Compose installed
- A domain with wildcard DNS pointing to the VPS (`*.yourdomain.com → VPS IP`)

## Build Images

```bash
# Build API + frontend
docker build -t my-saas-server:latest .

# Build graphs service
cd apps/graphs && langgraph build -t my-saas-graphs:latest
```

## Required Env Variables (`tools/compose/.env.vps`)

```env
APP_DOMAIN=app.yourdomain.com
ADMINER_DOMAIN=adminer.yourdomain.com
ACME_EMAIL=you@yourdomain.com

POSTGRES_DB=myapp
POSTGRES_USER=myuser
POSTGRES_PASSWORD=strongpassword

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
TAVILY_API_KEY=

LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
LANGSMITH_TRACING_V2=true

MAIL_FROM=noreply@yourdomain.com

# htpasswd-encoded: user:hash
ADMINER_BASIC_AUTH=admin:$$apr1$$...
```

## Start

```bash
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps up -d
```

## Networking

- `public` network — Traefik, server, adminer (internet-facing)
- `internal` network — postgres, redis, graphs (not exposed)

Adminer is protected by Traefik basic auth middleware.

## Log Rotation

All services use JSON file logging with rotation: 10 MB × 5 files = max 50 MB per service.
