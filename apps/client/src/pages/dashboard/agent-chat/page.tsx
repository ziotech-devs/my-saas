import { t } from "@lingui/macro";
import { Button, ScrollArea } from "@my-saas/ui";
import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

import { useAgentChat } from "@/client/services/agent-chat/use-agent-chat";
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

export const AgentChatPage = () => {
  const { messages, isLoading, sendMessage, editMessage, clearMessages } = useAgentChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <>
      <Helmet>
        <title>
          {t`Agent Chat`} - {t`My SaaS`}
        </title>
      </Helmet>

      <div className="flex h-[calc(100vh-80px)] flex-col lg:h-[calc(100vh-32px)]">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            // Empty state — centered hero layout
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
                <ChatInput onSend={sendMessage} isLoading={isLoading} autoFocus />
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
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            // Active chat — messages + bottom input
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Top bar with new chat button */}
              <div className="flex items-center justify-end border-b px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <PlusIcon className="size-3.5" />
                  {t`New chat`}
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
                  {messages.map((message, index) => {
                    if (message.role === "human") {
                      return (
                        <HumanMessage
                          key={message.id}
                          content={message.content}
                          onEdit={(newContent) => editMessage(index, newContent)}
                        />
                      );
                    }
                    return (
                      <AiMessage
                        key={message.id}
                        content={message.content}
                        isError={message.role === "error"}
                      />
                    );
                  })}
                  {isLoading && <LoadingDots />}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="border-t bg-background/80 px-4 py-4 backdrop-blur-sm">
                <div className="mx-auto max-w-2xl">
                  <ChatInput onSend={sendMessage} isLoading={isLoading} />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {t`Powered by Tavily web search + OpenAI`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
