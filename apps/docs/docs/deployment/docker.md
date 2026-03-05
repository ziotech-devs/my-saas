---
id: docker
title: Docker
---

# Docker

## Compose Files

| File | Purpose |
|---|---|
| `compose.dev.yml` | Local development (Postgres, MinIO, Redis, Adminer) |
| `tools/compose/development.yml` | Alternative dev compose |
| `tools/compose/simple.yml` | Minimal single-server production |
| `tools/compose/traefik.yml` | Production with Traefik reverse proxy |
| `tools/compose/swarm.yml` | Docker Swarm production setup |

## Local Development

```bash
docker compose -f compose.dev.yml up -d
```

To start only the database (minimum required):

```bash
docker compose -f compose.dev.yml up -d postgres
```

## Services

| Service | Port | Description |
|---|---|---|
| PostgreSQL | 5432 | Main database |
| MinIO | 9000 | Object storage |
| Redis | 6379 | Used by graphs service |
| Adminer | 8080 | DB admin UI |
