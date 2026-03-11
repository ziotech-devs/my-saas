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
git clone https://github.com/ziotech-devs/my-saas
cd my-saas
pnpm install
```

## Environment Setup

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

## Quick Start (local)

**1. Start infrastructure services**

```bash
docker compose -f compose.dev.yml up -d
```

This starts:
- **PostgreSQL** (port 5432) — main application database
- **Graphs** (port 2024) — LangGraph service
- **MinIO** (port 9000) — file storage
- **Redis** (port 6379) — AI graphs checkpointer
- **Adminer** (port 8080) — database admin UI

**2. Set up the database**

```bash
pnpm prisma:generate     # generate the Prisma client (required before first pnpm dev)
pnpm prisma:migrate:dev  # apply migrations
```

**3. Run the app**

```bash
pnpm dev          # API + client
pnpm graphs:dev   # AI agent service (separate terminal)
```

This starts:
- NestJS API on http://localhost:3000
- React client on http://localhost:5173

## Next Steps

- [Architecture](./architecture) — understand the stack, project structure, and request flow
- [Deployment → Docker](./deployment/docker) — Docker Compose details and service reference
