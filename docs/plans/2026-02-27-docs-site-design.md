# Docs Site Design

**Date:** 2026-02-27
**Approach:** Option A — Standalone Docusaurus app inside monorepo

## Overview

Add `apps/docs` as a standard Docusaurus project integrated into the Nx monorepo. Audience: developers using the boilerplate. Default Docusaurus theme, no custom styling.

## Structure

```
apps/docs/
├── project.json              # Nx targets: serve (port 4000), build
├── docusaurus.config.ts
├── sidebars.ts
├── static/
└── docs/
    ├── getting-started.md
    ├── architecture.md
    ├── features/
    │   ├── auth.md           # JWT, OAuth (GitHub, Google), OpenID, 2FA
    │   ├── billing.md        # Stripe
    │   ├── feature-flags.md
    │   ├── mail.md
    │   ├── storage.md        # MinIO / S3
    │   ├── i18n.md           # Lingui + Crowdin
    │   ├── jobs.md           # Background jobs
    │   ├── admin.md          # Adminer DB admin
    │   └── ai-agents.md      # LangGraph orchestration
    ├── libraries/
    │   ├── ui.md             # Shadcn/Radix components
    │   ├── hooks.md
    │   ├── dto.md
    │   └── utils.md
    ├── deployment/
    │   ├── cloud.md          # AWS (ECS, S3, CloudFront, RDS)
    │   └── docker.md
    └── contributing.md
```

## Nx Integration

- `project.json` with `serve` and `build` targets using Docusaurus CLI
- Served on port 4000 (`nx run docs:serve`)
- Not included in default `pnpm dev` to avoid slowing down main workflow
- Initial content populated from existing README.md, CLAUDE.md, CONTRIBUTING.md

## Content Structure per Feature Page

Each feature page follows: Overview → Setup → Configuration → Usage
