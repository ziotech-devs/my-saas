import { useCallback, useRef, useState } from "react";
import { runScraperGraph } from "./client";

export type ChatRole = "human" | "ai" | "error";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type UseAgentChatReturn = {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  editMessage: (index: number, newContent: string) => Promise<void>;
  clearMessages: () => void;
};

let messageCounter = 0;
const nextId = () => String(++messageCounter);

export const useAgentChat = (): UseAgentChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // One thread per conversation — LangGraph checkpointer handles the history
  const threadIdRef = useRef<string | null>(null);

  const run = useCallback(async (priorMessages: ChatMessage[], content: string, threadId: string | null) => {
    const humanMessage: ChatMessage = { id: nextId(), role: "human", content: content.trim() };
    setMessages([...priorMessages, humanMessage]);
    setIsLoading(true);

    const { result, error, threadId: returnedThreadId } = await runScraperGraph(
      content.trim(),
      threadId ?? undefined,
    );

    if (returnedThreadId && !threadIdRef.current) {
      threadIdRef.current = returnedThreadId;
    }

    const aiMessage: ChatMessage = {
      id: nextId(),
      role: error ? "error" : "ai",
      content: error ? `Error: ${error}` : (result ?? "No result returned."),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      await run(messages, content, threadIdRef.current);
    },
    [isLoading, messages, run],
  );

  const editMessage = useCallback(
    async (index: number, newContent: string) => {
      if (!newContent.trim() || isLoading) return;
      // Create a new thread for edits — branches from the edited point
      threadIdRef.current = null;
      await run(messages.slice(0, index), newContent, null);
    },
    [isLoading, messages, run],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    threadIdRef.current = null;
  }, []);

  return { messages, isLoading, sendMessage, editMessage, clearMessages };
};
