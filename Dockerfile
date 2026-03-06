# --- Base Image ---
FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# --- Build Image ---
FROM base AS build

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./tools/prisma /app/tools/prisma
COPY apps/docs/package.json ./apps/docs/package.json
RUN pnpm install --frozen-lockfile

COPY . .

# Install docs dependencies separately — pnpm workspace doesn't create apps/docs/node_modules during root install
RUN cd apps/docs && pnpm install --frozen-lockfile

# Disable Nx daemon and cloud in Docker — avoids SQLite/EPIPE errors in isolated build env
ENV NX_DAEMON=false
ENV NX_NO_CLOUD=true

RUN pnpm nx run server:build && pnpm nx run client:build && pnpm nx run docs:build

# --- Release Image ---
FROM base AS release

RUN apt-get update && apt-get install -y dumb-init wget openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node --from=build /app/.npmrc /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/apps/docs/build ./apps/docs/build
COPY --chown=node:node --from=build /app/tools/prisma ./tools/prisma
RUN pnpm prisma generate

USER node

ENV TZ=UTC
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD [ "dumb-init", "node", "dist/apps/server/main" ]
