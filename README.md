## 🚀 [My SaaS – Full-Stack SaaS Boilerplate](https://ziotech.dev/saas-boilerplate)

**Production-ready SaaS boilerplate with React, NestJS, Prisma, PostgreSQL, Redis, Stripe, and AI features.**

- 🌐 **Live demo**: [my-saas.ziotech.dev](https://my-saas.ziotech.dev)
- 📚 **Documentation**: [docs.ziotech.dev](https://docs.ziotech.dev)

---
<img width="1602" height="840" alt="image" src="https://github.com/user-attachments/assets/fadd594b-5925-4b1c-bb65-6419b25a0972" />


### 💡 What is this?

**My SaaS** is a batteries-included boilerplate for building modern SaaS products. It gives you:

- 🎨 **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn, Radix, React Query  
- 🧱 **Backend**: NestJS, Prisma, PostgreSQL, Redis  
- 🧰 **Monorepo tooling**: Nx workspace with `pnpm` for fast, incremental dev  

The goal is to let you focus on your product logic instead of rebuilding authentication, billing, admin dashboards, and infrastructure from scratch.

---

### ✨ Key Features

- 🔐 **Authentication & Accounts**
  - Secure user auth and session management
  - Role-based access control (e.g. user/admin)
- 💳 **Billing & Subscriptions (Stripe)**
  - Stripe-powered subscriptions and payments
  - Plan management and metered billing–ready architecture
- 🛠️ **Admin Dashboard**
  - Admin-facing views to manage users and data
  - Ready to extend with your own domain-specific modules
- 🤖 **AI Chat & Agents**
  - AI-powered chat/assistant features
  - LangGraph-based `graphs` app for more advanced workflows
- 🚩 **Feature Flags**
  - Turn features on/off per user or environment
  - Safely roll out new capabilities
- 📧 **Email & Notifications**
  - Mail sending pipeline with templating
  - Room to plug in your preferred provider
- 📁 **Storage & File Handling**
  - Object storage integration (e.g. MinIO/S3-compatible)
  - Upload/download flows ready to extend
- 🌍 **Internationalization (i18n)**
  - Translation pipeline and i18n-aware UI
- ⚙️ **Background Jobs & Workers**
  - Redis-backed async processing for long-running tasks
- 🧪 **Adminer & Dev Tooling**
  - Adminer database UI, local dev Docker setup
  - Linting, formatting, and testing wired in

> This boilerplate is opinionated but modular — you can keep the parts you like and remove or replace others.

---

### 🏗️ Tech Stack & Architecture

- **Frontend**
  - React 18 + TypeScript
  - Vite dev/build tooling
  - TailwindCSS + Shadcn + Radix UI components
  - React Query for data fetching and caching
  - Zod for schema validation

- **Backend**
  - NestJS for modular API architecture
  - Prisma ORM with PostgreSQL
  - Redis for caching, queues, and background jobs
  - Zod for shared validation

- **Monorepo & Tooling**
  - Nx workspace (apps + shared packages)
  - `pnpm` workspaces

**Apps**

- `packages/server` – NestJS API
- `packages/client` – React web app
- `packages/graphs` – LangGraph / AI workflows

**Shared libraries**

- `packages/dto` – Shared DTOs
- `packages/hooks` – Shared hooks
- `packages/schema` – Shared schemas
- `packages/ui` – Shared UI components
- `packages/utils` – Shared utilities

---

### 💻 Local Development

You can run the full stack locally using Docker and `compose.dev.yml`.

#### ⚡ Quick Start (Postgres, Redis, MinIO, Adminer)

From the repo root, bring up all main services:

```bash
docker compose -f compose.dev.yml up -d

# Generate Prisma client & run migrations
pnpm prisma:generate
pnpm prisma:migrate:dev

# (Optional) seed data
pnpm prisma:seed

# Start monorepo dev
pnpm dev

# (Optional) start graphs app separately if needed
pnpm graphs:dev
```

This will typically start:

- **PostgreSQL** – main application database  
- **Redis** – cache and background jobs  
- **MinIO (S3-compatible)** – local object storage  
- **Adminer** – DB web UI (often on `http://localhost:8080`)

---

### 🧾 Scripts (root)

Some commonly used scripts (check `package.json` for the full list):

- **Development**
  - `pnpm dev` – Run dev servers for all main apps via Nx
- **Build & Start**
  - `pnpm build` – Build all apps with Nx
  - `pnpm start` – Start the compiled backend (after build)
- **Database**
  - `pnpm prisma:generate` – Generate Prisma client
  - `pnpm prisma:migrate` – Apply production migrations
  - `pnpm prisma:migrate:dev` – Dev migrations
  - `pnpm prisma:studio` – Open Prisma Studio
- **Quality**
  - `pnpm lint` / `pnpm lint:fix` – Lint all projects
  - `pnpm test` – Run tests (where configured)

---

### 📐 Conventions & Principles

- **Functional components only** in React (no classes)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party types)
- **String literal types** instead of enums
- **No `any`** – strict typing with TypeScript
- **Event handlers over `useEffect`** for state updates

These conventions help keep the codebase predictable, composable, and easy to refactor as your SaaS grows.

---

### 🚀 Next Steps

- Explore the code under `packages/server` and `packages/client`
- Tailor the auth, billing, and admin flows to your product
- Add your own features on top of the existing AI chat, feature flags, and admin tooling
- Dive deeper into the docs at [docs.ziotech.dev](https://docs.ziotech.dev)

If you run into anything confusing or have ideas for improvements, treat this README as a living document and update it as the project evolves.
