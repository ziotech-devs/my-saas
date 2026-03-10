import { createContext, useContext, useState, type ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

export type AgentState = {
  messages: Message[];
  result?: string | null;
};

export type StreamContextType = ReturnType<typeof useStream<AgentState>>;

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const useStreamContext = (): StreamContextType => {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error("useStreamContext must be used inside StreamProvider");
  return ctx;
};

export const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [threadId, setThreadId] = useState<string | null>(null);

  const apiUrl =
    (import.meta.env["VITE_LANGGRAPH_URL"] as string | undefined) ??
    `${window.location.origin}/api/graphs`;

  const stream = useStream<AgentState>({
    apiUrl,
    assistantId: "scraper_graph",
    threadId,
    onThreadId: setThreadId,
  });

  return <StreamContext.Provider value={stream}>{children}</StreamContext.Provider>;
};
