# VPS Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the full stack to a VPS using a single Docker Compose file with Traefik (HTTPS), the LangGraph graphs server proxied through NestJS, and Adminer on its own subdomain.

**Architecture:** Single `vps.yml` compose file with two networks — `public` (Traefik-routed services) and `internal` (backend services). The React client calls `/api/graphs/*` on the NestJS server, which proxies to the internal LangGraph container. Traefik handles TLS termination via Let's Encrypt.

**Tech Stack:** Docker Compose v2, Traefik v3, NestJS (Express adapter), `http-proxy-middleware`, LangGraph platform image, PostgreSQL 16, Redis 7, AdminerEvo

---

## Task 1: Add LangGraph proxy middleware to NestJS

The LangGraph SDK (`client.ts`) is configured with `VITE_LANGGRAPH_URL`. In production, we proxy through NestJS so the graphs container stays off the public internet.

**Files:**
- Modify: `apps/server/src/main.ts`
- Modify: `package.json` (add dependency)

**Step 1: Install `http-proxy-middleware`**

```bash
pnpm add http-proxy-middleware --filter @my-saas/server
```

Expected: `http-proxy-middleware` added to server's dependencies.

**Step 2: Add proxy middleware in `main.ts`**

In `apps/server/src/main.ts`, import and register the proxy BEFORE `app.setGlobalPrefix(globalPrefix)`:

```typescript
import { createProxyMiddleware } from "http-proxy-middleware";
```

Add this block immediately after `app.use(cookieParser())`:

```typescript
// Proxy LangGraph SDK requests to the internal graphs service
const graphsUrl = process.env["GRAPHS_URL"] ?? "http://localhost:8123";
app.use(
  "/api/graphs",
  createProxyMiddleware({
    target: graphsUrl,
    changeOrigin: true,
    pathRewrite: { "^/api/graphs": "" },
  }),
);
```

**Step 3: Verify the server still starts**

```bash
pnpm dev
```

Expected: Server starts on port 3000 with no errors. Ignore GRAPHS_URL not available in dev — the proxy will 502 only when a graphs request is actually made.

**Step 4: Commit**

```bash
git add apps/server/src/main.ts package.json pnpm-lock.yaml
git commit -m "feat: proxy /api/graphs to internal LangGraph service"
```

---

## Task 2: Update the React client to use the NestJS proxy URL

`VITE_LANGGRAPH_URL` is baked into the frontend at build time. In production it must point to `https://app.yourdomain.com/api/graphs`.

**Files:**
- Modify: `apps/client/src/services/agent-chat/client.ts`

**Step 1: Read the current client**

File: `apps/client/src/services/agent-chat/client.ts:1`

Current value: `const LANGGRAPH_URL = import.meta.env["VITE_LANGGRAPH_URL"] ?? "http://localhost:2024";`

No code change needed here — the env var already controls the URL. The default stays `localhost:2024` for local dev (direct to LangGraph dev server). In production the Docker build will inject `VITE_LANGGRAPH_URL=https://app.yourdomain.com/api/graphs`.

Document this in the `.env.vps.example` (Task 3). No code change required for this file.

---

## Task 3: Create the VPS compose file

**Files:**
- Create: `tools/compose/vps.yml`

**Step 1: Write the compose file**

```yaml
# tools/compose/vps.yml
# Production VPS deployment using Traefik for TLS termination.
# Requires a domain with wildcard DNS pointing to the VPS.
# Build the server image: docker build -t my-saas-server:latest .
# Build the graphs image: cd apps/graphs && langgraph build -t my-saas-graphs:latest
# Start: docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps up -d

name: my-saas

networks:
  public:
  internal:

volumes:
  postgres_data:
  langgraph_redis_data:
  letsencrypt_data:

services:

  # ── Reverse proxy ──────────────────────────────────────────────────────────
  traefik:
    image: traefik:v3
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --providers.docker.exposedByDefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.tlsChallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - letsencrypt_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - public

  # ── Application (NestJS + built React client) ───────────────────────────────
  server:
    image: my-saas-server:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      langgraph-redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      PUBLIC_URL: https://${APP_DOMAIN}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      GRAPHS_URL: http://graphs:8000
      # Storage — set STORAGE_SKIP_BUCKET_CHECK to avoid startup errors when MinIO is not deployed
      STORAGE_URL: http://localhost:9000/default
      STORAGE_ENDPOINT: localhost
      STORAGE_PORT: 9000
      STORAGE_BUCKET: default
      STORAGE_ACCESS_KEY: disabled
      STORAGE_SECRET_KEY: disabled
      STORAGE_USE_SSL: "false"
      STORAGE_SKIP_BUCKET_CHECK: "true"
      # Chrome — not deployed; disable features that require it
      CHROME_TOKEN: disabled
      CHROME_URL: http://localhost:3001
      MAIL_FROM: ${MAIL_FROM:-noreply@example.com}
    labels:
      - traefik.enable=true
      - traefik.http.routers.server.rule=Host(`${APP_DOMAIN}`)
      - traefik.http.routers.server.entrypoints=websecure
      - traefik.http.routers.server.tls.certresolver=letsencrypt
      - traefik.http.services.server.loadbalancer.server.port=3000
    networks:
      - public
      - internal

  # ── LangGraph graphs service ────────────────────────────────────────────────
  graphs:
    image: my-saas-graphs:latest
    restart: unless-stopped
    depends_on:
      langgraph-redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    environment:
      REDIS_URI: redis://langgraph-redis:6379
      DATABASE_URI: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4o-mini}
      TAVILY_API_KEY: ${TAVILY_API_KEY}
      LANGSMITH_API_KEY: ${LANGSMITH_API_KEY}
      LANGSMITH_PROJECT: ${LANGSMITH_PROJECT}
      LANGSMITH_TRACING_V2: ${LANGSMITH_TRACING_V2:-true}
    networks:
      - internal

  # ── PostgreSQL ──────────────────────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - internal

  # ── Redis (LangGraph checkpointer) ──────────────────────────────────────────
  langgraph-redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - langgraph_redis_data:/data
    healthcheck:
      test: redis-cli ping
      interval: 5s
      timeout: 1s
      retries: 5
    networks:
      - internal

  # ── Adminer (database UI) ────────────────────────────────────────────────────
  adminer:
    image: shyim/adminerevo:latest
    restart: unless-stopped
    environment:
      ADMINER_DEFAULT_DRIVER: pgsql
      ADMINER_DEFAULT_SERVER: postgres
      ADMINER_DEFAULT_DB: ${POSTGRES_DB}
    labels:
      - traefik.enable=true
      - traefik.http.routers.adminer.rule=Host(`${ADMINER_DOMAIN}`)
      - traefik.http.routers.adminer.entrypoints=websecure
      - traefik.http.routers.adminer.tls.certresolver=letsencrypt
      - traefik.http.services.adminer.loadbalancer.server.port=8080
      - traefik.http.routers.adminer.middlewares=adminer-auth
      - traefik.http.middlewares.adminer-auth.basicauth.users=${ADMINER_BASIC_AUTH}
    networks:
      - public
      - internal
```

**Step 2: Validate the compose file**

```bash
docker compose -f tools/compose/vps.yml config
```

Expected: Prints the resolved compose config with no errors. If it fails with "variable not set" errors for `${APP_DOMAIN}` etc., run with a minimal env:

```bash
APP_DOMAIN=app.example.com ADMINER_DOMAIN=adminer.example.com \
POSTGRES_DB=postgres POSTGRES_USER=postgres POSTGRES_PASSWORD=pass \
ACME_EMAIL=admin@example.com ADMINER_BASIC_AUTH='user:$$apr1$$abc' \
OPENAI_API_KEY=x TAVILY_API_KEY=x LANGSMITH_API_KEY=x LANGSMITH_PROJECT=x \
ACCESS_TOKEN_SECRET=x REFRESH_TOKEN_SECRET=x \
docker compose -f tools/compose/vps.yml config
```

Expected: Full resolved YAML printed with no errors.

**Step 3: Commit**

```bash
git add tools/compose/vps.yml
git commit -m "feat: add VPS Docker Compose file with Traefik + LangGraph"
```

---

## Task 4: Create the environment variables template

**Files:**
- Create: `tools/compose/.env.vps.example`

**Step 1: Write the env template**

```bash
# tools/compose/.env.vps.example
# Copy to .env.vps and fill in your values.
# NEVER commit the actual .env.vps file.

# ── Traefik ──────────────────────────────────────────────────────────────────
# Your email for Let's Encrypt certificate notifications
ACME_EMAIL=admin@yourdomain.com

# ── Domains ──────────────────────────────────────────────────────────────────
APP_DOMAIN=app.yourdomain.com
ADMINER_DOMAIN=adminer.yourdomain.com

# ── PostgreSQL ──────────────────────────────────────────────────────────────
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-strong-password

# ── Application secrets ──────────────────────────────────────────────────────
# Generate with: openssl rand -hex 32
ACCESS_TOKEN_SECRET=change-me
REFRESH_TOKEN_SECRET=change-me

# ── Mail ─────────────────────────────────────────────────────────────────────
MAIL_FROM=noreply@yourdomain.com

# ── LangGraph / AI ──────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
TAVILY_API_KEY=tvly-...
LANGSMITH_API_KEY=ls__...
LANGSMITH_PROJECT=my-saas
LANGSMITH_TRACING_V2=true

# ── Adminer basic auth ────────────────────────────────────────────────────────
# Generate with: htpasswd -nb admin yourpassword
# Dollar signs must be doubled ($$) to escape Docker Compose variable interpolation.
# Example (admin / changeme): admin:$$apr1$$xyz$$hash
ADMINER_BASIC_AUTH=admin:$$apr1$$replacewithreal$$hash

# ── Client build-time variable ───────────────────────────────────────────────
# Set this when building the Docker image so the LangGraph SDK calls NestJS proxy.
# docker build --build-arg VITE_LANGGRAPH_URL=https://app.yourdomain.com/api/graphs .
VITE_LANGGRAPH_URL=https://app.yourdomain.com/api/graphs
```

**Step 2: Add `.env.vps` to `.gitignore`**

Open `.gitignore` and add under the existing env section:

```
tools/compose/.env.vps
```

**Step 3: Commit**

```bash
git add tools/compose/.env.vps.example .gitignore
git commit -m "chore: add VPS env template and gitignore rule"
```

---

## Task 5: Update root Dockerfile to accept `VITE_LANGGRAPH_URL` as build arg

The root `Dockerfile` builds the NestJS server but does NOT currently build the React client. The React client's `VITE_LANGGRAPH_URL` must be injected at image build time.

**Files:**
- Read: `Dockerfile`
- Modify: `Dockerfile`

**Step 1: Read the current Dockerfile**

File: `Dockerfile` (root)

Current build command: `RUN pnpm nx run server:build`

The React client is served as static files by NestJS — look at how the client is built and served:

```bash
# Check how client is bundled with server
cat apps/server/webpack.config.js
# or
grep -r "client" apps/server/project.json | head -20
```

**Step 2: Determine client build approach**

Run: `npx nx show project server --json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(k) for k in d.get('targets',{}).keys()]"`

If the server build already includes the client (check `webpack.config.js` for static file serving), add the build arg to the existing `RUN pnpm nx run server:build` command. If the client is built separately, add a separate build step.

**Step 3: Add the build arg to `Dockerfile`**

In the `build` stage, add before the `COPY . .` line:

```dockerfile
ARG VITE_LANGGRAPH_URL
ENV VITE_LANGGRAPH_URL=$VITE_LANGGRAPH_URL
```

This exposes the arg to the Nx build so Vite picks it up.

**Step 4: Verify locally (dry run)**

```bash
docker build --build-arg VITE_LANGGRAPH_URL=https://app.example.com/api/graphs --target build --no-cache -t test-build . 2>&1 | tail -5
```

Expected: Build stage completes without error.

**Step 5: Commit**

```bash
git add Dockerfile
git commit -m "feat: pass VITE_LANGGRAPH_URL build arg to Docker image"
```

---

## Task 6: Write the deployment runbook (README section)

**Files:**
- Modify: `tools/compose/README.md` or create it if absent

**Step 1: Check if README exists**

```bash
ls tools/compose/
```

**Step 2: Create/update `tools/compose/README.md`**

```markdown
# Docker Compose Files

## VPS Production Deploy (`vps.yml`)

### Prerequisites

- VPS with Docker and Docker Compose v2 installed
- Domain with DNS A record pointing to the VPS IP
- `langgraph` CLI installed locally for building the graphs image

### One-time setup

**1. Build images on the VPS (or push from CI):**

```bash
# Server image
docker build \
  --build-arg VITE_LANGGRAPH_URL=https://app.yourdomain.com/api/graphs \
  -t my-saas-server:latest .

# Graphs image (run from project root)
cd apps/graphs && langgraph build -t my-saas-graphs:latest && cd ../..
```

**2. Create your env file:**

```bash
cp tools/compose/.env.vps.example tools/compose/.env.vps
# Edit .env.vps with your real values
```

**3. Run database migrations:**

```bash
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps run --rm server \
  sh -c "pnpm prisma migrate deploy"
```

### Start the stack

```bash
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps up -d
```

### Scale the server

```bash
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps up -d --scale server=3
```

Traefik automatically picks up new replicas and round-robins traffic.

### View logs

```bash
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps logs -f server
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps logs -f graphs
```

### Update the stack

```bash
docker build --build-arg VITE_LANGGRAPH_URL=https://app.yourdomain.com/api/graphs -t my-saas-server:latest .
docker compose -f tools/compose/vps.yml --env-file tools/compose/.env.vps up -d --no-deps --build server
```
```

**Step 3: Commit**

```bash
git add tools/compose/README.md
git commit -m "docs: add VPS deployment runbook"
```

---

## Summary

| Task | File | Description |
|------|------|-------------|
| 1 | `apps/server/src/main.ts` | Proxy `/api/graphs` → `http://graphs:8000` |
| 2 | — | Client already uses `VITE_LANGGRAPH_URL` correctly |
| 3 | `tools/compose/vps.yml` | Full production compose file |
| 4 | `tools/compose/.env.vps.example` | Env template + gitignore |
| 5 | `Dockerfile` | Add `VITE_LANGGRAPH_URL` build arg |
| 6 | `tools/compose/README.md` | Deployment runbook |
