# Streaming Agent Chat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the blocking `client.runs.wait()` agent chat with real-time streaming using `useStream` from `@langchain/langgraph-sdk/react`, adapting components from the `src/` reference folder.

**Architecture:** A `StreamProvider` wraps the page and exposes the `useStream` hook via context. Message components read from the stream context for editing, regenerating, and displaying streamed content. The Python graph is updated to handle proper LangChain message objects instead of raw tuples.

**Tech Stack:** `@langchain/langgraph-sdk/react` (useStream), `react-syntax-highlighter`, `react-markdown`, `remark-gfm`, `@phosphor-icons/react`, `@my-saas/ui`, Zustand (openai store), Tailwind CSS

---

### Task 1: Install missing dependency

**Files:**
- Modify: `package.json` (root)

**Step 1: Install react-syntax-highlighter**

```bash
pnpm add react-syntax-highlighter
pnpm add -D @types/react-syntax-highlighter
```

**Step 2: Verify install**

```bash
ls node_modules/react-syntax-highlighter
```
Expected: directory exists

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-syntax-highlighter"
```

---

### Task 2: Create `tooltip-icon-button.tsx`

Adapted from `src/components/thread/tooltip-icon-button.tsx`. Swaps `@/components/ui/*` imports for `@my-saas/ui`.

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/tooltip-icon-button.tsx`

**Step 1: Create the file**

```tsx
import { forwardRef } from "react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import type { ComponentPropsWithoutRef } from "react";

type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
};

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
  ({ children, tooltip, side = "bottom", className, ...rest }, ref) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            {...rest}
            className={cn("size-6 p-1", className)}
            ref={ref}
          >
            {children}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);

TooltipIconButton.displayName = "TooltipIconButton";
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/tooltip-icon-button.tsx
git commit -m "feat(agent-chat): add tooltip-icon-button component"
```

---

### Task 3: Create `syntax-highlighter.tsx`

Adapted from `src/components/thread/syntax-highlighter.tsx`.

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/syntax-highlighter.tsx`

**Step 1: Create the file**

```tsx
import { PrismAsyncLight as SyntaxHighlighterPrism } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import { coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { FC } from "react";

SyntaxHighlighterPrism.registerLanguage("js", tsx);
SyntaxHighlighterPrism.registerLanguage("jsx", tsx);
SyntaxHighlighterPrism.registerLanguage("ts", tsx);
SyntaxHighlighterPrism.registerLanguage("tsx", tsx);
SyntaxHighlighterPrism.registerLanguage("python", python);
SyntaxHighlighterPrism.registerLanguage("bash", bash);
SyntaxHighlighterPrism.registerLanguage("json", json);

type SyntaxHighlighterProps = {
  children: string;
  language: string;
  className?: string;
};

export const SyntaxHighlighter: FC<SyntaxHighlighterProps> = ({ children, language, className }) => (
  <SyntaxHighlighterPrism
    language={language}
    style={coldarkDark}
    customStyle={{ margin: 0, width: "100%", background: "transparent", padding: "1.5rem 1rem" }}
    className={className}
  >
    {children}
  </SyntaxHighlighterPrism>
);
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/syntax-highlighter.tsx
git commit -m "feat(agent-chat): add syntax-highlighter component"
```

---

### Task 4: Create `markdown-text.tsx`

Adapted from `src/components/thread/markdown-text.tsx`. Removes katex (math) to avoid extra deps. Uses local `SyntaxHighlighter`.

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/markdown-text.tsx`

**Step 1: Create the file**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useState, type FC } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cn } from "@my-saas/utils";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { TooltipIconButton } from "./tooltip-icon-button";

type CodeHeaderProps = { language?: string; code: string };

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!code || isCopied) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase">{language}</span>
      <TooltipIconButton tooltip="Copy" onClick={handleCopy}>
        {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </TooltipIconButton>
    </div>
  );
};

const components: Record<string, FC<{ className?: string; children?: React.ReactNode }>> = {
  h1: ({ className, ...props }) => (
    <h1 className={cn("mb-8 text-4xl font-extrabold tracking-tight", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("mb-4 mt-8 text-3xl font-semibold tracking-tight first:mt-0", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mb-4 mt-6 text-2xl font-semibold tracking-tight first:mt-0", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-5 mt-5 leading-7 first:mt-0 last:mb-0", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("text-primary font-medium underline underline-offset-4", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn("border-l-2 pl-6 italic", className)} {...props} />
  ),
  pre: ({ className, ...props }) => (
    <pre className={cn("overflow-x-auto rounded-lg bg-black text-white max-w-4xl", className)} {...props} />
  ),
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      const language = match[1];
      const code = String(children).replace(/\n$/, "");
      return (
        <>
          <CodeHeader language={language} code={code} />
          <SyntaxHighlighter language={language} className={className}>
            {code}
          </SyntaxHighlighter>
        </>
      );
    }
    return (
      <code className={cn("rounded bg-muted px-1 py-0.5 font-semibold text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
};

const MarkdownTextImpl: FC<{ children: string }> = ({ children }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as never}>
    {children}
  </ReactMarkdown>
);

export const MarkdownText = memo(MarkdownTextImpl);
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/markdown-text.tsx
git commit -m "feat(agent-chat): add markdown-text component"
```

---

### Task 5: Create `stream-provider.tsx`

Wraps `useStream` with the project's config (NestJS proxy URL, `scraper_graph` assistant ID, OpenAI/Tavily keys from store).

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_providers/stream-provider.tsx`

**Step 1: Create the file**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

// Matches the Python ScraperState fields that come back over the wire
export type AgentState = {
  messages: Message[];
  result?: string | null;
};

// useStream's return type, inferred so it stays in sync with SDK updates
export type StreamContextType = ReturnType<typeof useStream<AgentState>>;

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const useStreamContext = (): StreamContextType => {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error("useStreamContext must be used inside StreamProvider");
  return ctx;
};

export const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [threadId, setThreadId] = useState<string | null>(null);

  // Derives the LangGraph URL from the current origin so it works in both
  // local dev (Vite proxies /api → NestJS → LangGraph) and production.
  const apiUrl =
    (import.meta.env["VITE_LANGGRAPH_URL"] as string | undefined) ??
    `${window.location.origin}/api/graphs`;

  const stream = useStream<AgentState>({
    apiUrl,
    assistantId: "scraper_graph",
    threadId,
    onThreadId: setThreadId,
    streamMode: ["values"],
  });

  return <StreamContext.Provider value={stream}>{children}</StreamContext.Provider>;
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_providers/stream-provider.tsx
git commit -m "feat(agent-chat): add StreamProvider with useStream hook"
```

---

### Task 6: Create `message-actions.tsx`

Copy/regenerate for AI messages, copy/edit for human messages. Adapted from `src/components/thread/messages/shared.tsx`.

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/message-actions.tsx`

**Step 1: Create the file**

```tsx
import { useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CopyIcon,
  PencilIcon,
  XIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { TooltipIconButton } from "./tooltip-icon-button";

type AiMessageActionsProps = {
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
};

type HumanMessageActionsProps = {
  content: string;
  isLoading: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
};

const CopyButton = ({ content, disabled }: { content: string; disabled: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipIconButton tooltip="Copy" variant="ghost" onClick={handleCopy} disabled={disabled}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div key="check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <CheckIcon className="size-4 text-green-500" />
          </motion.div>
        ) : (
          <motion.div key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <CopyIcon className="size-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipIconButton>
  );
};

export const AiMessageActions = ({ content, isLoading, onRegenerate }: AiMessageActionsProps) => (
  <div className="flex items-center gap-1">
    <CopyButton content={content} disabled={isLoading} />
    <TooltipIconButton tooltip="Regenerate" variant="ghost" disabled={isLoading} onClick={onRegenerate}>
      <ArrowCounterClockwiseIcon className="size-4" />
    </TooltipIconButton>
  </div>
);

export const HumanMessageActions = ({
  content,
  isLoading,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
}: HumanMessageActionsProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <TooltipIconButton tooltip="Cancel" variant="ghost" disabled={isLoading} onClick={onCancelEdit}>
          <XIcon className="size-4" />
        </TooltipIconButton>
        <TooltipIconButton tooltip="Submit" variant="secondary" disabled={isLoading} onClick={onSubmitEdit}>
          <PaperPlaneTiltIcon className="size-4" />
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <CopyButton content={content} disabled={isLoading} />
      <TooltipIconButton tooltip="Edit" variant="ghost" disabled={isLoading} onClick={onStartEdit}>
        <PencilIcon className="size-4" />
      </TooltipIconButton>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/message-actions.tsx
git commit -m "feat(agent-chat): add message action buttons"
```

---

### Task 7: Replace `ai-message.tsx`

**Files:**
- Modify: `apps/client/src/pages/dashboard/agent-chat/_components/ai-message.tsx`

**Step 1: Replace file contents**

```tsx
import type { Message, Checkpoint } from "@langchain/langgraph-sdk";
import { cn } from "@my-saas/utils";
import { useStreamContext } from "../_providers/stream-provider";
import { AiMessageActions } from "./message-actions";
import { MarkdownText } from "./markdown-text";

type AiMessageProps = {
  message: Message;
  isLoading: boolean;
  onRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
};

// Extracts a plain string from Message content (string or complex array)
const getContentString = (content: Message["content"]): string => {
  if (typeof content === "string") return content;
  return (content as Array<{ type: string; text?: string }>)
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join(" ");
};

export const AiMessage = ({ message, isLoading, onRegenerate }: AiMessageProps) => {
  const stream = useStreamContext();
  const meta = stream.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const contentString = getContentString(message.content);
  const isLastMessage =
    stream.messages.length > 0 &&
    stream.messages[stream.messages.length - 1].id === message.id;

  return (
    <div className={cn("flex items-start mr-auto gap-2 group max-w-[85%]")}>
      <div className="flex flex-col gap-1">
        {contentString.length > 0 && (
          <div className="py-1 text-sm leading-relaxed">
            <MarkdownText>{contentString}</MarkdownText>
          </div>
        )}

        {/* Show actions on last message always, on others only on hover */}
        <div
          className={cn(
            "flex items-center transition-opacity",
            isLastMessage && !isLoading
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <AiMessageActions
            content={contentString}
            isLoading={isLoading}
            onRegenerate={() => onRegenerate(parentCheckpoint)}
          />
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/ai-message.tsx
git commit -m "feat(agent-chat): replace ai-message with streaming markdown version"
```

---

### Task 8: Replace `human-message.tsx`

**Files:**
- Modify: `apps/client/src/pages/dashboard/agent-chat/_components/human-message.tsx`

**Step 1: Replace file contents**

```tsx
import { useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { cn } from "@my-saas/utils";
import { Textarea } from "@my-saas/ui";
import { useStreamContext } from "../_providers/stream-provider";
import { HumanMessageActions } from "./message-actions";

type HumanMessageProps = {
  message: Message;
  isLoading: boolean;
};

const getContentString = (content: Message["content"]): string => {
  if (typeof content === "string") return content;
  return (content as Array<{ type: string; text?: string }>)
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join(" ");
};

export const HumanMessage = ({ message, isLoading }: HumanMessageProps) => {
  const stream = useStreamContext();
  const meta = stream.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const contentString = getContentString(message.content);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = () => {
    setEditValue(contentString);
    setIsEditing(true);
  };

  const handleSubmitEdit = () => {
    setIsEditing(false);
    const newMessage: Message = { type: "human", content: editValue };
    stream.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        optimisticValues: (prev) => {
          const base = meta?.firstSeenState?.values;
          if (!base) return prev;
          return { ...base, messages: [...(base.messages ?? []), newMessage] };
        },
      },
    );
  };

  return (
    <div className={cn("flex items-center ml-auto gap-2 group", isEditing && "w-full max-w-xl")}>
      <div className={cn("flex flex-col gap-1", isEditing && "w-full")}>
        {isEditing ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmitEdit();
              }
            }}
            className="focus-visible:ring-0"
            autoFocus
          />
        ) : (
          <p className="px-4 py-2 rounded-3xl bg-muted w-fit ml-auto whitespace-pre-wrap text-sm">
            {contentString}
          </p>
        )}

        <div
          className={cn(
            "flex ml-auto transition-opacity",
            isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <HumanMessageActions
            content={contentString}
            isLoading={isLoading}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            onCancelEdit={() => setIsEditing(false)}
            onSubmitEdit={handleSubmitEdit}
          />
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/human-message.tsx
git commit -m "feat(agent-chat): replace human-message with editable version"
```

---

### Task 9: Modify `chat-input.tsx`

Add a stop button that cancels the current stream run.

**Files:**
- Modify: `apps/client/src/pages/dashboard/agent-chat/_components/chat-input.tsx`

**Step 1: Add `onStop` prop and stop button**

Replace full file content:

```tsx
import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { ArrowUpIcon, SpinnerGapIcon, StopIcon } from "@phosphor-icons/react";
import { type FormEvent, type KeyboardEvent, useState } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  autoFocus?: boolean;
};

export const ChatInput = ({ onSend, onStop, isLoading, autoFocus }: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 rounded-2xl border bg-background px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md outline-none"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        placeholder={t`Ask anything...`}
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 max-h-40 disabled:opacity-50"
      />
      {isLoading ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onStop}
          className="shrink-0 size-8 rounded-xl"
        >
          <StopIcon className="size-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim()}
          className="shrink-0 size-8 rounded-xl"
        >
          <ArrowUpIcon className="size-4" />
        </Button>
      )}
    </form>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/chat-input.tsx
git commit -m "feat(agent-chat): add stop button to chat input"
```

---

### Task 10: Rewrite `page.tsx`

Wraps the page in `StreamProvider`. Uses `stream.messages` directly. Passes OpenAI/Tavily config on every submit.

**Files:**
- Modify: `apps/client/src/pages/dashboard/agent-chat/page.tsx`

**Step 1: Replace file contents**

```tsx
import { t } from "@lingui/macro";
import { Button, ScrollArea } from "@my-saas/ui";
import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import type { Message } from "@langchain/langgraph-sdk";

import { useOpenAiStore } from "@/client/stores/openai";
import { StreamProvider, useStreamContext } from "./_providers/stream-provider";
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
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), newMessage],
        }),
      },
    );
  };

  const handleRegenerate = (parentCheckpoint: Parameters<typeof stream.submit>[1] extends { checkpoint?: infer C } ? C : never) => {
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const handleClear = () => {
    // Reload the page so useStream resets its thread state cleanly
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
                {messages.map((message) => {
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
                {isLoading && !messages.some((m) => m.type === "ai") && <LoadingDots />}
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
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/page.tsx
git commit -m "feat(agent-chat): rewrite page with streaming useStream hook"
```

---

### Task 11: Update `scraper_graph.py` for proper message objects

The LangGraph SDK sends `HumanMessage` objects. Update helpers to handle both proper objects and legacy tuples.

**Files:**
- Modify: `apps/graphs/scraper_graph.py`

**Step 1: Replace file contents**

```python
"""LangGraph graph for web search and AI-powered analysis."""

import logging
import operator
import os
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from tavily import TavilyClient

logger = logging.getLogger(__name__)


class ScraperState(TypedDict):
    """State for the scraper graph.

    `messages` uses operator.add so LangGraph's checkpointer accumulates the
    full conversation across runs on the same thread. Accepts both proper
    BaseMessage objects (sent by the JS SDK) and legacy (role, content) tuples.
    """

    messages: Annotated[list, operator.add]
    search_results: str | None
    result: str | None


SYSTEM_PROMPT = (
    "You are a web research assistant. You will receive a user query and web "
    "search results.\n\n"
    "Your task:\n"
    "1. Carefully read the search results.\n"
    "2. Identify the most important information that answers the query.\n"
    "3. Write a clear, concise summary in plain text.\n"
    "4. Take prior conversation context into account for follow-up questions.\n"
    "5. If there is uncertainty or conflicting information, call it out.\n"
)


def _get_last_human_query(messages: list) -> str:
    """Extract the content of the last human/user message.

    Handles both proper BaseMessage objects (from the JS SDK) and legacy
    (role, content) tuples for backward compatibility.
    """
    for item in reversed(messages):
        # Proper BaseMessage object (sent by @langchain/langgraph-sdk)
        if isinstance(item, BaseMessage):
            if item.type in ("human", "user"):
                return item.content if isinstance(item.content, str) else ""
            continue
        # Legacy tuple format
        if isinstance(item, (tuple, list)) and len(item) == 2:
            role, content = item
            if role in ("user", "human"):
                return content
    return ""


_ROLE_MAP = {
    "user": HumanMessage,
    "human": HumanMessage,
    "assistant": AIMessage,
    "ai": AIMessage,
}


def _to_lc_message(msg) -> BaseMessage | None:
    """Convert any message format to a LangChain BaseMessage."""
    if isinstance(msg, BaseMessage):
        return msg
    if isinstance(msg, (tuple, list)) and len(msg) == 2:
        role, content = msg
        msg_class = _ROLE_MAP.get(role)
        if msg_class:
            return msg_class(content=content)
    return None


def search(state: ScraperState, config: RunnableConfig) -> dict:
    """Use Tavily to search for the latest human message query."""
    query = _get_last_human_query(state["messages"])
    if not query:
        return {"search_results": "No query provided."}

    configurable = config.get("configurable", {})
    api_key = configurable.get("tavily_api_key") or os.getenv("TAVILY_API_KEY")
    if not api_key:
        return {"search_results": ""}

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query=query, max_results=5, include_answer=True)

        parts = []

        answer = response.get("answer", "")
        if answer:
            parts.append(f"Direct answer: {answer}")

        for result in response.get("results", []):
            title = result.get("title", "")
            url = result.get("url", "")
            content = result.get("content", "").strip()
            if content:
                parts.append(f"Source: {title}\nURL: {url}\n{content}")

        if parts:
            return {"search_results": "\n\n---\n\n".join(parts)}
        return {"search_results": f"No search results found for: {query}"}

    except Exception as exception:
        logger.exception("Failed to search for: %s", query)
        return {"search_results": f"Search failed for '{query}': {str(exception)}"}


def agent(state: ScraperState, config: RunnableConfig) -> dict:
    """Summarize search results with full conversation context."""
    configurable = config.get("configurable", {})
    api_key = configurable.get("openai_api_key")
    model = configurable.get("openai_model") or "gpt-4o-mini"

    if not api_key:
        error = "No OpenAI API key provided. Please add your API key in the settings."
        return {"messages": [AIMessage(content=error)], "result": error}

    all_messages = state["messages"]
    query = _get_last_human_query(all_messages)
    if not query:
        error = "No user query found in message history."
        return {"messages": [AIMessage(content=error)], "result": error}

    search_results = state.get("search_results") or ""
    if len(search_results) > 50000:
        truncated = search_results[:50000] + "\n\n[Content truncated...]"
    else:
        truncated = search_results

    llm_messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Build conversation history excluding the last human message
    for msg in all_messages[:-1]:
        lc_msg = _to_lc_message(msg)
        if lc_msg:
            llm_messages.append(lc_msg)

    llm_messages.append(
        HumanMessage(
            content=(
                f"User query: {query}\n\n"
                f"Web search results:\n{truncated}\n\n"
                "Please provide a concise summary of the key information "
                "relevant to the query."
            )
        )
    )

    llm = ChatOpenAI(api_key=api_key, model=model, temperature=0.3)

    try:
        response = llm.invoke(llm_messages)
        return {"messages": [AIMessage(content=response.content)], "result": response.content}
    except Exception as exc:
        logger.exception("LLM invocation failed")
        error = f"Error: LLM call failed — {exc}"
        return {"messages": [AIMessage(content=error)], "result": error}


def create_graph():
    """Create the scraper graph — persistence is handled by the LangGraph platform."""
    workflow = StateGraph(ScraperState)

    workflow.add_node("search", search)
    workflow.add_node("agent", agent)

    workflow.add_edge(START, "search")
    workflow.add_edge("search", "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()


graph = create_graph()
```

**Step 2: Commit**

```bash
git add apps/graphs/scraper_graph.py
git commit -m "feat(graphs): handle proper LangChain message objects from JS SDK"
```

---

### Task 12: Delete old service files

**Files:**
- Delete: `apps/client/src/services/agent-chat/client.ts`
- Delete: `apps/client/src/services/agent-chat/use-agent-chat.ts`

**Step 1: Delete the files**

```bash
rm apps/client/src/services/agent-chat/client.ts
rm apps/client/src/services/agent-chat/use-agent-chat.ts
```

**Step 2: Check for any remaining imports**

```bash
grep -r "use-agent-chat\|services/agent-chat" apps/client/src --include="*.ts" --include="*.tsx"
```

Expected: no output (no remaining imports)

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(agent-chat): remove old blocking client and hook"
```

---

### Task 13: Run build and fix any TypeScript errors

**Step 1: Run the client build**

```bash
pnpm build
```

**Step 2: Fix any TypeScript or import errors**

Common issues to watch for:
- `handleRegenerate` type — `Checkpoint | null | undefined` from `@langchain/langgraph-sdk`
- `stream.submit` second arg type — import `type { SubmitOptions }` if needed
- Missing `cn` export from `@my-saas/utils` — fallback: `import { clsx } from "clsx"; import { twMerge } from "tailwind-merge"; const cn = (...inputs) => twMerge(clsx(inputs))`

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix(agent-chat): resolve TypeScript build errors"
```

---

## Notes

- The `handleClear` in `page.tsx` uses `window.location.reload()` as the simplest way to reset `useStream` state. A more elegant approach would be to reset thread state within the SDK, but `useStream` does not expose a reset method directly.
- The `_providers/` directory is co-located with the page, consistent with the existing `_components/` pattern.
- No `nuqs`, `sonner`, or `use-stick-to-bottom` are introduced — keeping the dependency footprint minimal.
- Math rendering (katex) is intentionally excluded — add `rehype-katex` + `remark-math` later if needed.
