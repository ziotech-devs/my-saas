# Docker Compose Files

| File | Purpose |
|------|---------|
| `vps.yml` | **Production VPS** — Traefik + LangGraph + Adminer |

---

## VPS Production Deploy (`vps.yml`)

Single-file production setup: Traefik (HTTPS via Let's Encrypt), NestJS server, internal LangGraph graphs service, PostgreSQL, Redis, and Adminer behind basic auth.

Uses the root `.env` file — Docker Compose picks it up automatically when run from the project root.

### Services

| Service | Accessible at | Notes |
|---------|--------------|-------|
| server | `https://APP_DOMAIN` | NestJS API + built React client |
| adminer | `https://ADMINER_DOMAIN` | Protected by basic auth |
| graphs | internal only | LangGraph API, proxied through NestJS at `/api/graphs` |
| postgres | internal only | |
| langgraph-redis | internal only | LangGraph checkpointer |

### Prerequisites

- VPS with Docker Engine and Docker Compose v2
- Domain with DNS A records pointing to the VPS IP:
  - `app.yourdomain.com` → VPS IP
  - `adminer.yourdomain.com` → VPS IP
  - `graphs.yourdomain.com` → VPS IP
- `langgraph` CLI for building the graphs image

### One-time setup

**1. Fill in `.env` at the project root** (see `.env.example` for all required vars, including the `VPS Deploy` section at the bottom)

**2. Build images**

```bash
# Server image
docker build -t my-saas-server:latest .

# Graphs image
cd apps/graphs && langgraph build -t my-saas-graphs:latest && cd ../..
```

**3. Run database migrations**

```bash
docker compose --project-directory . -f tools/compose/vps.yml run --rm server pnpm prisma migrate deploy
```

### Start the stack

```bash
docker compose --project-directory . -f tools/compose/vps.yml up -d
```

### Scale the server

Traefik automatically detects new replicas and round-robins traffic:

```bash
docker compose --project-directory . -f tools/compose/vps.yml up -d --scale server=3
```

### View logs

```bash
docker compose --project-directory . -f tools/compose/vps.yml logs -f server
docker compose --project-directory . -f tools/compose/vps.yml logs -f graphs
```

### Update the stack

```bash
docker build -t my-saas-server:latest .
docker compose --project-directory . -f tools/compose/vps.yml up -d --no-deps server
```

### Generate Adminer basic auth

```bash
# Install apache2-utils if needed: apt install apache2-utils
htpasswd -nb admin yourpassword
# Output: admin:$apr1$...
# In .env, double every $ → $$ for ADMINER_BASIC_AUTH
```

### Disabled features

Chrome (PDF printing) and MinIO (file storage) are not deployed in `vps.yml`. The server starts with dummy values for these — features that require them will return an error at runtime.
