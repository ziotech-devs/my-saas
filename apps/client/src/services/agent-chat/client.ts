import { Client } from "@langchain/langgraph-sdk";

// In production the NestJS server proxies /api/graphs to the internal LangGraph container,
// so no build-time URL is needed — we derive it from the current origin at runtime.
// Set VITE_LANGGRAPH_URL in .env to override (e.g. point directly at a local langgraph dev server).
const LANGGRAPH_URL = import.meta.env["VITE_LANGGRAPH_URL"] ?? `${window.location.origin}/api/graphs`;
const GRAPH_ID = "scraper_graph";

const client = new Client({ apiUrl: LANGGRAPH_URL });

type RunResult = {
  result: string | null;
  error: string | null;
  threadId: string;
};

export const runScraperGraph = async (
  query: string,
  threadId?: string,
): Promise<RunResult> => {
  try {
    // Reuse existing thread so LangGraph checkpointer accumulates messages.
    // On edit, pass undefined to create a fresh thread.
    const thread = threadId
      ? { thread_id: threadId }
      : await client.threads.create();

    const run = await client.runs.wait(thread.thread_id, GRAPH_ID, {
      input: {
        // operator.add reducer expects tuple arrays — matches Python ("user", content) format
        messages: [["user", query]],
      },
    });

    const state = run as { result?: string | null };
    return { result: state.result ?? null, error: null, threadId: thread.thread_id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { result: null, error: message, threadId: threadId ?? "" };
  }
};
