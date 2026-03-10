---
id: architecture
title: Architecture
---

# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, TailwindCSS, Shadcn/Radix UI |
| State | React Query (server), Zustand (client) |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| AI Agents | Python, LangGraph, LangChain |
| Monorepo | Nx, pnpm |
| Bundler | Vite (client), SWC (server) |

## Project Structure

```
apps/
├── server/     # NestJS API (port 3000)
├── client/     # React frontend (port 5173)
├── graphs/     # Python LangGraph service
└── docs/       # This docs site (port 4000)
libs/
├── dto/        # Shared DTOs
├── ui/         # Shadcn/Radix components
├── hooks/      # Shared React hooks
├── schema/     # Zod schemas
└── utils/      # Utilities
tools/
├── prisma/     # Database schema & migrations
└── compose/    # Docker Compose files
```

## Request Flow

```
Browser → React Client → NestJS API → Prisma → PostgreSQL
                      ↘ Python AI Service (LangGraph)
```
