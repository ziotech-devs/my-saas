---
description: VPS Docker Compose deployment for My SaaS - manage containers, debug issues, and operate the production stack on DigitalOcean
user-invocable: true
---

# VPS Skill

Manage the production Docker Compose stack running on a DigitalOcean VPS behind Cloudflare.

## Architecture

```
Browser → Cloudflare (<APP_DOMAIN>)   → Traefik (:443) → nginx → NestJS server (:3000)
Browser → Cloudflare (<GRAPHS_DOMAIN>) → Traefik (:443) → graphs (:8000)  [direct, SSE streaming]
                                                         → adminer (:8080)
                                                         → docs nginx
```

```
traefik          Reverse proxy + TLS (Let's Encrypt via HTTP-01 challenge)
nginx            Serves React SPA + proxies /api → server:3000
server           NestJS API (:3000)
docs             Docusaurus static site
graphs           LangGraph Python service — publicly exposed at GRAPHS_DOMAIN (SSE streaming direct to client)
postgres         PostgreSQL 16
langgraph-redis  Redis 7 (LangGraph checkpointer)
adminer          DB admin UI
```

**Important**: Domain is behind Cloudflare proxy (orange cloud). Traefik uses **HTTP-01** ACME challenge (not TLS-ALPN-01) because Cloudflare intercepts port 443.

## Key Info (fill in your values)

| Item | Value |
|------|-------|
| VPS IP | `<VPS_IP>` |
| Provider | DigitalOcean |
| App domain | `<APP_DOMAIN>` |
| Adminer domain | `<ADMINER_DOMAIN>` |
| Docs domain | `<DOCS_DOMAIN>` |
| Graphs domain | `<GRAPHS_DOMAIN>` |
| ACME email | `<ACME_EMAIL>` |
| Compose file | `tools/compose/production.yml` |
| Env file | `.env` (project root) |

## Common Commands

```bash
# Run all compose commands from project root
docker compose --project-directory . -f tools/compose/production.yml <command>

# Start / restart everything
docker compose --project-directory . -f tools/compose/production.yml up -d

# Restart single service (e.g. after .env change)
docker compose --project-directory . -f tools/compose/production.yml up -d --no-deps server

# View logs
docker logs my-saas-server-1 --tail 50 -f
docker logs my-saas-traefik-1 --tail 30
docker logs my-saas-nginx-1 --tail 30

# Container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Reload nginx config without downtime
docker exec my-saas-nginx-1 nginx -s reload
```

## Deploy New Server Image

```bash
# 1. Build image on VPS (from project root)
docker build -t my-saas-server:latest .

# 2. Restart server (also restarts client-init and docs-init to refresh static assets)
docker compose --project-directory . -f tools/compose/production.yml up -d --no-deps server client-init docs-init nginx
```

## Environment Variables

Stored in `.env` at project root. Sensitive values — **never commit**:

```bash
POSTGRES_USER=<DB_USER>
POSTGRES_PASSWORD=<DB_PASSWORD>       # avoid ? in password — breaks URL parsing
POSTGRES_DB=<DB_NAME>
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>?schema=public
ACCESS_TOKEN_SECRET=<secret>          # openssl rand -base64 64
REFRESH_TOKEN_SECRET=<secret>
ACME_EMAIL=<email>
APP_DOMAIN=<APP_DOMAIN>
ADMINER_DOMAIN=<ADMINER_DOMAIN>
ADMINER_BASIC_AUTH=<user:htpasswd>    # htpasswd -nb user pass
DOCS_DOMAIN=<DOCS_DOMAIN>
GRAPHS_DOMAIN=<GRAPHS_DOMAIN>         # e.g. graphs.yourdomain.com — exposed directly via Traefik for SSE streaming
OPENAI_API_KEY=<key>
TAVILY_API_KEY=<key>
LANGSMITH_API_KEY=<key>
LANGSMITH_PROJECT=<project>
```

## Firewall (UFW)

Ports that must be open:

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Traefik + ACME challenge)
ufw allow 443/tcp   # HTTPS (Traefik)
ufw status
```

## Networking Notes

- **nginx DNS caching**: nginx resolves `server` hostname once at startup. If the `server` container is recreated, nginx caches the old IP → 502. The `nginx.conf` uses `resolver 127.0.0.11 valid=5s` to re-resolve every 5s. If still stale, `docker restart my-saas-nginx-1`.
- **Cloudflare + ACME**: TLS-ALPN-01 challenge fails behind Cloudflare. Config uses `httpChallenge.entryPoint=web` in Traefik.
- **Password special chars**: `?` in `DATABASE_URL` is interpreted as query string start. Use alphanumeric + `!` or `$` only. If changing the password, also run `ALTER USER` in PostgreSQL — `.env` change alone is not enough.

## Troubleshooting

### 502 Bad Gateway
```bash
# Check which container is failing
docker ps --format "table {{.Names}}\t{{.Status}}"
docker logs my-saas-nginx-1 --tail 10   # shows upstream IP + error
docker logs my-saas-server-1 --tail 20  # Zod/startup errors

# If nginx shows "Connection refused" to an IP → stale DNS
docker restart my-saas-nginx-1
```

### Server crash-looping
```bash
docker logs my-saas-server-1 --tail 30
# Common causes:
# - Invalid DATABASE_URL (special chars in password like ?)
# - Missing required env var (Zod validation on startup)
```

### TLS cert failures
```bash
docker logs my-saas-traefik-1 --tail 20
# 403 tls-alpn → wrong challenge type (must use httpChallenge, not tlsChallenge)
# 522 → firewall blocking port 80 (check ufw)
# 429 rate-limited → too many failed attempts, wait 1h
```

### Test origin directly (bypass Cloudflare)
```bash
curl -sk --resolve "<APP_DOMAIN>:443:<VPS_IP>" https://<APP_DOMAIN>/api/health
```

### Change PostgreSQL password
```bash
# 1. Update .env
# 2. Run in DB container
docker exec my-saas-postgres-1 psql -U postgres -c "ALTER USER postgres WITH PASSWORD '<new_password>';"
# 3. Restart server
docker compose --project-directory . -f tools/compose/production.yml up -d --no-deps server
```
