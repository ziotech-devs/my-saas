---
id: getting-started
title: Getting Started
sidebar_position: 1
slug: /
---

# Getting Started

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for PostgreSQL and MinIO)
- Python 3.11+ (for AI agents)

## Installation

```bash
git clone https://github.com/talkenigs/my-saas
cd my-saas
pnpm install
```

## Environment Setup

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing JWT tokens
- `SECRET_KEY` — General app secret

## Quick Start (minimum)

The minimum you need is PostgreSQL and a `.env` file.

```bash
# 1. Start only PostgreSQL
docker compose -f compose.dev.yml up -d postgres

# 2. Set up the database
pnpm prisma:generate     # generate the Prisma client (required before first pnpm dev)
pnpm prisma:migrate:dev  # apply migrations
pnpm prisma:seed         # optional: load seed data

# 3. Run the app
pnpm dev
```

This starts:
- NestJS API on http://localhost:3000
- React client on http://localhost:5173
- Artboard on http://localhost:6173

## Full Local Setup

To use all features (file uploads, AI agents, DB admin):

```bash
# Start all services
docker compose -f compose.dev.yml up -d
```

This adds:
- **MinIO** (port 9000) — required for file storage
- **Redis** (port 6379) — required for the AI graphs service
- **Adminer** (port 8080) — database admin UI

Then run the app and optionally the AI agents:

```bash
pnpm dev          # API + client + artboard
pnpm graphs:dev   # AI agent service (separate terminal)
```

## Next Steps

- [Architecture](./architecture) — understand the stack, project structure, and request flow
- [Deployment → Docker](./deployment/docker) — Docker Compose details and service reference
