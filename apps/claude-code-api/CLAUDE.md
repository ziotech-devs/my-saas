# claude-code-api

A lightweight Express service that listens for Jira webhooks and autonomously implements tickets using the Claude Code agent SDK.

## What it does

When a Jira issue webhook fires, this service:
1. Pulls the latest `main` branch
2. Creates a branch `ticket/<jira-key>` (e.g. `ticket/proj-1`)
3. Runs Claude Code to implement the ticket (up to 50 turns, `acceptEdits` permission mode)
4. Runs a second Claude Code session to code-review the uncommitted changes
5. If issues are found, runs a third session to fix them
6. Commits, pushes the branch, and opens a PR via `gh`

The webhook handler responds with `202 Accepted` immediately — all processing is fire-and-forget.

## Commands

```bash
# Develop
nx run claude-code-api:serve

# Build
nx run claude-code-api:build

# Test
nx run claude-code-api:test

# Lint
nx run claude-code-api:lint
```

## Architecture

```
src/
├── main.ts                        # Express app bootstrap, /health endpoint
├── config.ts                      # Zod-validated env vars
├── logger.ts                      # Minimal structured JSON logger (stdout/stderr)
├── routes/
│   └── jira.ts                    # POST /webhook/jira — parses payload, fires runner
├── services/
│   ├── runner.ts                  # Orchestrates the full implementation pipeline
│   ├── claude-code.ts             # Wraps @anthropic-ai/claude-agent-sdk query() calls
│   └── git.ts                     # execSync wrappers for git and gh CLI
└── prompts/
    └── ticket.prompts.ts          # buildImplementationPrompt, buildReviewPrompt, buildFixPrompt
```

## Environment variables

| Variable              | Default         | Description |
|-----------------------|-----------------|-------------|
| `CLAUDE_CODE_API_PORT` | `3001`         | HTTP port the server listens on |
| `REPO_DIR`            | `process.cwd()` | Absolute path to the repo root where Claude Code runs |
| `WEBHOOK_SECRET`      | *(optional)*    | HMAC secret for verifying Jira webhook signatures |
| `NODE_ENV`            | `development`   | `development` or `production` |

## Endpoints

| Method | Path            | Description |
|--------|-----------------|-------------|
| GET    | `/health`       | Liveness check — returns `{ status: "ok" }` |
| POST   | `/webhook/jira` | Jira issue webhook — triggers ticket processing |

### Jira webhook payload (minimum required fields)

```json
{
  "issue": {
    "key": "PROJ-1",
    "fields": {
      "summary": "Add dark mode toggle",
      "description": "Optional detailed description"
    }
  }
}
```

## Claude SDK integration

`services/claude-code.ts` uses `query()` from `@anthropic-ai/claude-agent-sdk`. Every run is persisted to `logs/runs/<session-id>.json`.

Two modes:
- **`runImplementation`** — `permissionMode: "acceptEdits"`, up to 50 turns. Writes code but does not commit.
- **`runCodeReview`** — `permissionMode: "bypassPermissions"`, up to 10 turns. Accepts a prompt string; caller is responsible for prompt content (see `prompts/ticket.prompts.ts`).

## Git operations

`services/git.ts` shells out to `git` and `gh` via `execSync`. Requires `git` in PATH and `gh` authenticated (`gh auth login`).

## Local testing with ngrok

To receive real Jira webhooks locally:

```bash
# 1. Start the service
nx run claude-code-api:serve

# 2. Expose it
ngrok http 3001

# 3. Register the public URL in Jira as a webhook:
#    https://<your-subdomain>.ngrok-free.app/webhook/jira
```

## Adding new webhook sources

1. Add a route file under `routes/` following the pattern in `routes/jira.ts`
2. Mount it in `main.ts` under a new path (e.g. `/webhook/github`)
3. Reuse `runImplementation` / `runCodeReview` from `services/claude-code.ts`
