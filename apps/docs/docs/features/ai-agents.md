---
id: ai-agents
title: AI Agents (LangGraph)
---

# AI Agents

The `apps/graphs` service is a Python LangGraph microservice for AI agent orchestration.

## Architecture

```
NestJS API ──HTTP──▶ Python LangGraph Service
                          │
                    ┌─────▼──────┐
                    │ StateGraph │
                    │  ┌──────┐  │
                    │  │search│  │
                    │  └──┬───┘  │
                    │  ┌──▼───┐  │
                    │  │ LLM  │  │
                    │  └──────┘  │
                    └────────────┘
```

## Setup

```bash
cd apps/graphs
pip install -r requirements.txt
```

## Environment Variables

```env
OPENAI_API_KEY=
TAVILY_API_KEY=
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
