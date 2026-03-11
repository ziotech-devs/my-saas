---
id: ai-agents
title: AI Agents (LangGraph)
---

# AI Agents

The `apps/graphs` service is a Python LangGraph microservice for AI agent orchestration.

## Architecture

API keys (OpenAI, Tavily) are configured by the user in the client settings UI. The client sends requests to the NestJS API, which proxies them to the LangGraph service — injecting the keys at the server level.

```
Client (settings UI)
  │  API keys stored per user
  ▼
NestJS API ──HTTP + keys──▶ Python LangGraph Service
                                  │
                            ┌─────▼──────┐
                            │ StateGraph │
                            │  ┌──────┐  │
                            │  │search│  │  ← Tavily
                            │  └──┬───┘  │
                            │  ┌──▼───┐  │
                            │  │ LLM  │  │  ← OpenAI
                            │  └──────┘  │
                            └────────────┘
```

## Setup

```bash
cd apps/graphs
pip install -r requirements.txt
```

## Running

```bash
pnpm graphs:dev
```

## Key Files

- `apps/graphs/scraper_graph.py` — Example graph (web search + LLM analysis)
- `apps/graphs/langgraph.json` — LangGraph config

## Adding a New Graph

1. Create a new Python file in `apps/graphs/`
2. Define a `StateGraph` with typed state (`TypedDict`)
3. Add nodes and edges
4. Compile and expose via FastAPI or LangGraph server
