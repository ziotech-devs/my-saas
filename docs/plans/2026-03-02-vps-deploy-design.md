# VPS Deployment Design

**Date:** 2026-03-02
**Approach:** Single Traefik compose file with network isolation, HTTPS via Let's Encrypt

---

## Goal

Deploy the full stack to a single VPS using Docker Compose. The React app (served by NestJS) is publicly accessible. The LangGraph graphs server is internal-only and proxied through NestJS. Adminer is accessible on its own subdomain with basic auth. PostgreSQL and Redis persist data via named volumes.

---

## Services

| Service  | Image                       | Role                              |
|----------|-----------------------------|-----------------------------------|
| traefik  | traefik:v3                  | Reverse proxy, TLS termination    |
| server   | custom build                | NestJS API + built React client   |
| graphs   | my-saas-graphs:latest       | LangGraph agent server            |
| postgres | postgres:16-alpine          | Primary database                  |
| redis    | redis:7-alpine              | Cache / queue                     |
| adminer  | adminer                     | Database admin UI                 |

Chrome/Browserless and MinIO are **excluded** from this deployment.

---

## Network Topology

```
Internet
    │
  :80/:443
    │
 [traefik]  ── Let's Encrypt TLS, certs in named volume
    │
    ├─ app.yourdomain.com       → [server] (scalable replicas)
    │                                ├─ internal → [graphs] (:8123)
    │                                ├─ internal → [postgres] (:5432)
    │                                └─ internal → [redis] (:6379)
    │
    └─ adminer.yourdomain.com   → [adminer] (basic auth middleware)
                                     └─ internal → [postgres]
```

**Networks:**
- `public`: traefik, server, adminer
- `internal`: server, adminer, graphs, postgres, redis

---

## Service Configuration Details

### traefik
- Entrypoints: `:80` (HTTP → HTTPS redirect) and `:443` (TLS)
- Let's Encrypt `tlsChallenge`, cert stored in `letsencrypt_data` volume
- Docker provider with `exposedByDefault: false`
- Dashboard disabled in production

### server (NestJS)
- `restart: unless-stopped`
- `depends_on` with healthcheck conditions: postgres, redis, graphs
- Traefik label: `Host(\`app.yourdomain.com\`)`, port 3000
- Key env vars:
  - `DATABASE_URL=postgresql://postgres:PASS@postgres:5432/postgres`
  - `REDIS_URL=redis://redis:6379`
  - NestJS proxies `/api/graphs/*` → `http://graphs:8123` internally
- Scale with `docker compose up --scale server=N` — Traefik round-robins automatically

### graphs (LangGraph)
- Image built via: `langgraph build -t my-saas-graphs:latest`
- Internal network only — no Traefik labels
- LangSmith env vars:
  - `LANGCHAIN_TRACING_V2=true`
  - `LANGCHAIN_API_KEY=<secret>`
  - `LANGCHAIN_PROJECT=<project-name>`
- Other required env vars:
  - `OPENAI_API_KEY=<secret>`
  - `TAVILY_API_KEY=<secret>`

### postgres
- `postgres:16-alpine`
- Named volume: `postgres_data`
- Healthcheck: `pg_isready -U postgres -d postgres`
- Internal network only

### redis
- `redis:7-alpine`
- Named volume: `redis_data`
- Internal network only

### adminer
- `ADMINER_DEFAULT_SERVER: postgres`
- On both `public` (routed by Traefik) and `internal` (reaches postgres)
- Traefik label: `Host(\`adminer.yourdomain.com\`)`, port 8080
- Traefik `basicauth` middleware — htpasswd credentials in `.env`

---

## Volumes

| Volume           | Used by          |
|------------------|------------------|
| postgres_data    | postgres         |
| redis_data       | redis            |
| letsencrypt_data | traefik          |

---

## Compose File Location

`tools/compose/vps.yml`

---

## NestJS Proxy Module (required)

Since `VITE_LANGGRAPH_URL` is baked into the frontend at build time, the client will call `/api/graphs/*` on the same domain. NestJS needs a proxy module that forwards these requests to `http://graphs:8123`. This is a small addition to the server app — out of scope for the compose file itself but required for full wiring.

---

## Environment Variables

Sensitive values go in a `.env` file (not committed). The compose file references them via `${VAR_NAME}` substitution.

Required secrets:
- `POSTGRES_PASSWORD`
- `POSTGRES_USER`
- `POSTGRES_DB`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `LANGCHAIN_API_KEY`
- `LANGCHAIN_PROJECT`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ADMINER_BASIC_AUTH` (htpasswd format)

---

## Deployment Commands

```bash
# Build graphs image
cd apps/graphs && langgraph build -t my-saas-graphs:latest

# Build server image
nx run server:build

# Start stack
docker compose -f tools/compose/vps.yml up -d

# Scale server
docker compose -f tools/compose/vps.yml up -d --scale server=3
```
