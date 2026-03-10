import { t } from "@lingui/macro";
import { Button, ScrollArea } from "@my-saas/ui";
import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import type { Message, Checkpoint } from "@langchain/langgraph-sdk";

import { useOpenAiStore } from "@/client/stores/openai";
import { StreamProvider, useStreamContext, type AgentState } from "./_providers/stream-provider";
import { AiMessage } from "./_components/ai-message";
import { ChatInput } from "./_components/chat-input";
import { HumanMessage } from "./_components/human-message";
import { LoadingDots } from "./_components/loading-dots";

const SUGGESTIONS = [
  "Latest AI news today",
  "Best laptop for developers 2025",
  "How does Stripe billing work?",
  "React vs Next.js differences",
];

const AgentChatContent = () => {
  const stream = useStreamContext();
  const { apiKey, model, tavilyApiKey } = useOpenAiStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      type: "human",
      content,
    };

    stream.submit(
      { messages: [newMessage] },
      {
        streamMode: ["values"],
        config: {
          configurable: {
            openai_api_key: apiKey ?? undefined,
            openai_model: model ?? undefined,
            tavily_api_key: tavilyApiKey ?? undefined,
          },
        },
        optimisticValues: (prev: AgentState) => ({
          ...prev,
          messages: [...(prev.messages ?? []), newMessage],
        }),
      },
    );
  };

  const handleRegenerate = (parentCheckpoint: Checkpoint | null | undefined) => {
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const handleClear = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col lg:h-[calc(100vh-32px)]">
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.15 } }}
            className="flex flex-1 flex-col items-center justify-center gap-7 px-4"
          >
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl font-semibold tracking-tight"
              >
                {t`What do you want to know?`}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mt-2 text-sm text-muted-foreground"
              >
                {t`Search the web and get AI-summarized answers`}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="w-full max-w-2xl"
            >
              <ChatInput onSend={handleSend} onStop={() => stream.stop()} isLoading={isLoading} autoFocus />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-end border-b px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <PlusIcon className="size-3.5" />
                {t`New chat`}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
                {messages.map((message: Message) => {
                  if (message.type === "human") {
                    return (
                      <HumanMessage
                        key={message.id}
                        message={message}
                        isLoading={isLoading}
                      />
                    );
                  }
                  if (message.type === "ai") {
                    return (
                      <AiMessage
                        key={message.id}
                        message={message}
                        isLoading={isLoading}
                        onRegenerate={handleRegenerate}
                      />
                    );
                  }
                  return null;
                })}
                {isLoading && !messages.some((m: Message) => m.type === "ai") && <LoadingDots />}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-background/80 px-4 py-4 backdrop-blur-sm">
              <div className="mx-auto max-w-2xl">
                <ChatInput onSend={handleSend} onStop={() => stream.stop()} isLoading={isLoading} />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {t`Powered by Tavily web search + OpenAI`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AgentChatPage = () => (
  <>
    <Helmet>
      <title>
        {t`Agent Chat`} - {t`My SaaS`}
      </title>
    </Helmet>
    <StreamProvider>
      <AgentChatContent />
    </StreamProvider>
  </>
);
