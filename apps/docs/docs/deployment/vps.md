---
id: vps
title: VPS (Self-Hosted)
---

# VPS Deployment (Self-Hosted)

Deploy the full stack on a single VPS using Docker Compose + Traefik for TLS termination and automatic Let's Encrypt certificates.

**Compose file:** `tools/compose/production.yml`
**CI/CD:** `.github/workflows/deploy-vps.yml`

## Services

| Service | Description |
|---|---|
| Traefik | Reverse proxy, TLS termination, HTTP→HTTPS redirect |
| server | NestJS API + built React client |
| graphs | LangGraph AI agent service |
| postgres | PostgreSQL 16 |
| langgraph-redis | Redis (LangGraph checkpointer) |
| adminer | DB admin UI (protected by basic auth) |

> MinIO is **not** deployed in this setup. Dummy env values prevent startup errors.

## Prerequisites

- A VPS with Docker + Docker Compose installed
- A domain with DNS pointing to the VPS
- The repo cloned to `~/my-saas` on the VPS

## CI/CD Pipeline

Deployment is triggered manually via `workflow_dispatch`.

```
workflow_dispatch
    │
    ├──▶ Build & Push Server Image  → ghcr.io/<owner>/my-saas-server:latest
    ├──▶ Build & Push Graphs Image  → ghcr.io/<owner>/my-saas-graphs:latest
    │         (both run in parallel)
    │
    └──▶ Deploy to VPS via SSH
              │  docker login ghcr.io
              │  git pull
              │  docker compose pull
              │  docker compose up -d --remove-orphans
              └─ prisma migrate deploy
```

Images are published to GitHub Container Registry (GHCR) using `GITHUB_TOKEN` — no extra registry credentials needed.

## Required GitHub Secrets

| Secret | Description |
|---|---|
| `SERVER_HOST` | VPS IP or hostname |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private SSH key for VPS access |

## Required Env Variables (`.env` on VPS)

```env
SERVER_IMAGE=ghcr.io/yourusername/my-saas-server:latest
GRAPHS_IMAGE=ghcr.io/yourusername/my-saas-graphs:latest

APP_DOMAIN=app.yourdomain.com
ADMINER_DOMAIN=adminer.yourdomain.com
DOCS_DOMAIN=docs.yourdomain.com
ACME_EMAIL=you@yourdomain.com

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strongpassword

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

MAIL_FROM=noreply@yourdomain.com

# Generate: htpasswd -nb admin yourpassword  (double $ signs → $$)
ADMINER_BASIC_AUTH=admin:$$apr1$$replaceme$$hash
```

## Networking

- `public` network — Traefik, nginx, adminer, graphs (internet-facing)
- `internal` network — postgres, redis, server (not exposed)

Adminer is protected by Traefik basic auth using `ADMINER_BASIC_AUTH` from `.env`.

## Log Rotation

All services use JSON file logging with rotation: 10 MB × 5 files = max 50 MB per service.
