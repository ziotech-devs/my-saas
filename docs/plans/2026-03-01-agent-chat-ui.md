# Agent Chat UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a chat UI page in the dashboard that lets users talk to the `scraper_graph` LangGraph agent (web search + AI summarization), with conversation history held in React state (clears on refresh).

**Architecture:** Use `@langchain/langgraph-sdk` browser client to invoke `scraper_graph` via `runs.wait()` on the LangGraph server running at `VITE_LANGGRAPH_URL`. Each user message calls the graph with `{query: message}` and appends the `result` as an AI reply. Conversation is stored in React component state only.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Shadcn UI (`@my-saas/ui`), `@langchain/langgraph-sdk`, `@phosphor-icons/react`, `framer-motion`, `react-markdown`, `react-helmet-async`

---

## Prerequisite: Install SDK

```bash
pnpm add @langchain/langgraph-sdk
```

Run from the workspace root (`/Users/talkenig/Code/boilerplates/my-saas`).

---

### Task 1: Add env var for LangGraph URL

**Files:**
- Modify: `.env`
- Modify: `apps/client/src/` (read-only reference — Vite exposes `VITE_*` vars automatically)

**Step 1: Add env var to .env**

Open `.env` and add at the bottom (after the LangSmith section):

```
# LangGraph
VITE_LANGGRAPH_URL=http://localhost:2024
```

**Step 2: Commit**

```bash
git add .env
git commit -m "feat: add VITE_LANGGRAPH_URL env var for LangGraph server"
```

---

### Task 2: Create the LangGraph client service

**Files:**
- Create: `apps/client/src/services/agent-chat/client.ts`

**Step 1: Create the file**

```typescript
import { Client } from "@langchain/langgraph-sdk";

const LANGGRAPH_URL = import.meta.env["VITE_LANGGRAPH_URL"] ?? "http://localhost:2024";
const GRAPH_ID = "scraper_graph";

const client = new Client({ apiUrl: LANGGRAPH_URL });

type RunResult = {
  result: string | null;
  error: string | null;
};

export const runScraperGraph = async (query: string): Promise<RunResult> => {
  try {
    const thread = await client.threads.create();

    const run = await client.runs.wait(thread.thread_id, GRAPH_ID, {
      input: { query },
    });

    // ScraperState returns { query, search_results, result }
    const state = run as { result?: string | null };
    return { result: state.result ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { result: null, error: message };
  }
};
```

**Step 2: Commit**

```bash
git add apps/client/src/services/agent-chat/client.ts
git commit -m "feat: add LangGraph client service for scraper_graph"
```

---

### Task 3: Create the useAgentChat hook

**Files:**
- Create: `apps/client/src/services/agent-chat/use-agent-chat.ts`

**Step 1: Create the hook**

```typescript
import { useState, useCallback } from "react";
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
  clearMessages: () => void;
};

let messageCounter = 0;
const nextId = () => String(++messageCounter);

export const useAgentChat = (): UseAgentChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const humanMessage: ChatMessage = {
      id: nextId(),
      role: "human",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, humanMessage]);
    setIsLoading(true);

    const { result, error } = await runScraperGraph(content.trim());

    const aiMessage: ChatMessage = {
      id: nextId(),
      role: error ? "error" : "ai",
      content: error ? `Error: ${error}` : (result ?? "No result returned."),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
};
```

**Step 2: Commit**

```bash
git add apps/client/src/services/agent-chat/use-agent-chat.ts
git commit -m "feat: add useAgentChat hook with message state management"
```

---

### Task 4: Create HumanMessage component

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/human-message.tsx`

**Step 1: Create the file**

```typescript
type HumanMessageProps = {
  content: string;
};

export const HumanMessage = ({ content }: HumanMessageProps) => (
  <div className="flex justify-end">
    <p className="max-w-xl rounded-3xl bg-muted px-4 py-2 whitespace-pre-wrap text-sm">
      {content}
    </p>
  </div>
);
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/human-message.tsx
git commit -m "feat: add HumanMessage chat bubble component"
```

---

### Task 5: Create AiMessage component

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/ai-message.tsx`

The AI response uses `react-markdown` for rendering. Check if it's already installed:

```bash
grep '"react-markdown"' /Users/talkenig/Code/boilerplates/my-saas/package.json
```

If not found, install it: `pnpm add react-markdown remark-gfm`

**Step 1: Create the file**

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@my-saas/utils";

type AiMessageProps = {
  content: string;
  isError?: boolean;
};

export const AiMessage = ({ content, isError }: AiMessageProps) => (
  <div className="flex justify-start">
    <div
      className={cn(
        "max-w-2xl rounded-2xl px-4 py-3 text-sm prose prose-sm dark:prose-invert",
        isError && "text-destructive",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  </div>
);
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/ai-message.tsx
git commit -m "feat: add AiMessage component with markdown rendering"
```

---

### Task 6: Create loading dots component

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/loading-dots.tsx`

**Step 1: Create the file**

```typescript
export const LoadingDots = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 h-9">
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]" />
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]" />
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]" />
    </div>
  </div>
);
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/loading-dots.tsx
git commit -m "feat: add LoadingDots animation component"
```

---

### Task 7: Create ChatInput component

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/_components/chat-input.tsx`

**Step 1: Create the file**

```typescript
import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { PaperPlaneTiltIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { FormEvent, useState, KeyboardEvent } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  isLoading: boolean;
};

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
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
      className="flex items-end gap-2 rounded-2xl border bg-muted p-3 shadow-sm"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t`Ask anything... (e.g. "What's the latest iPhone price?")`}
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground field-sizing-content max-h-40 disabled:opacity-50"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !value.trim()}
        className="shrink-0 size-8"
      >
        {isLoading ? (
          <SpinnerGapIcon className="size-4 animate-spin" />
        ) : (
          <PaperPlaneTiltIcon className="size-4" />
        )}
      </Button>
    </form>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/_components/chat-input.tsx
git commit -m "feat: add ChatInput component with textarea and send button"
```

---

### Task 8: Create the AgentChatPage

**Files:**
- Create: `apps/client/src/pages/dashboard/agent-chat/page.tsx`

**Step 1: Create the file**

```typescript
import { t } from "@lingui/macro";
import { ScrollArea } from "@my-saas/ui";
import { RobotIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

import { useAgentChat } from "@/client/services/agent-chat/use-agent-chat";
import { AiMessage } from "./_components/ai-message";
import { ChatInput } from "./_components/chat-input";
import { HumanMessage } from "./_components/human-message";
import { LoadingDots } from "./_components/loading-dots";

export const AgentChatPage = () => {
  const { messages, isLoading, sendMessage } = useAgentChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const hasMessages = messages.length > 0;

  return (
    <>
      <Helmet>
        <title>
          {t`Agent Chat`} - {t`My SaaS`}
        </title>
      </Helmet>

      <div className="flex h-[calc(100vh-80px)] flex-col lg:h-[calc(100vh-32px)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 pb-4"
        >
          <RobotIcon className="size-7" />
          <h1 className="text-3xl font-bold tracking-tight">{t`Agent Chat`}</h1>
        </motion.div>

        {/* Message list */}
        <ScrollArea className="flex-1 pr-1">
          {!hasMessages && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground pt-20">
              <RobotIcon className="size-12 opacity-30" />
              <p className="text-sm max-w-sm">
                {t`Ask me anything — I'll search the web and summarize the results for you.`}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 py-2 max-w-3xl">
            {messages.map((message) => {
              if (message.role === "human") {
                return <HumanMessage key={message.id} content={message.content} />;
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

        {/* Input area */}
        <div className="pt-4 max-w-3xl">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t`Powered by Tavily web search + OpenAI`}
          </p>
        </div>
      </div>
    </>
  );
};
```

**Step 2: Commit**

```bash
git add apps/client/src/pages/dashboard/agent-chat/page.tsx
git commit -m "feat: add AgentChatPage with message list and scroll-to-bottom"
```

---

### Task 9: Add route to router

**Files:**
- Modify: `apps/client/src/router/index.tsx`

**Step 1: Add the import** (after the BillingPage import, around line 11):

```typescript
import { AgentChatPage } from "../pages/dashboard/agent-chat/page";
```

**Step 2: Add the route** (inside the `DashboardLayout` route block, after the billing route around line 77):

```typescript
<Route path="agent-chat" element={<AgentChatPage />} />
```

The dashboard block should look like:
```typescript
<Route element={<DashboardLayout />}>
  <Route path="billing" element={<BillingPage />} />
  <Route path="settings" element={<SettingsPage />} />
  <Route path="agent-chat" element={<AgentChatPage />} />

  <Route index element={<BillingPage />} />
</Route>
```

**Step 3: Commit**

```bash
git add apps/client/src/router/index.tsx
git commit -m "feat: add /dashboard/agent-chat route"
```

---

### Task 10: Add sidebar tab

**Files:**
- Modify: `apps/client/src/pages/dashboard/_components/sidebar.tsx`

**Step 1: Add the import for the icon** (add `ChatCircleTextIcon` to the existing phosphor import, around line 6):

```typescript
import {
  ChatCircleTextIcon,
  CreditCardIcon,
  FadersHorizontalIcon,
  HouseIcon,
} from "@phosphor-icons/react";
```

**Step 2: Add keyboard shortcut handler** (after the billing shortcut handler, around line 89):

```typescript
useKeyboardShortcut(["shift", "a"], () => {
  void navigate("/dashboard/agent-chat");
  setOpen?.(false);
});
```

**Step 3: Add sidebar item** (insert after the billing item in the `sidebarItems` array):

```typescript
{
  path: "/dashboard/agent-chat",
  name: t`Agent Chat`,
  shortcut: "⇧A",
  icon: <ChatCircleTextIcon />,
},
```

The full `sidebarItems` array should be:
```typescript
const sidebarItems: SidebarItem[] = [
  {
    path: "/dashboard",
    name: t`Dashboard`,
    shortcut: "⇧D",
    icon: <HouseIcon />,
  },
  {
    path: "/dashboard/billing",
    name: t`Billing`,
    shortcut: "⇧B",
    icon: <CreditCardIcon />,
  },
  {
    path: "/dashboard/agent-chat",
    name: t`Agent Chat`,
    shortcut: "⇧A",
    icon: <ChatCircleTextIcon />,
  },
  {
    path: "/dashboard/settings",
    name: t`Settings`,
    shortcut: "⇧S",
    icon: <FadersHorizontalIcon />,
  },
];
```

**Step 4: Commit**

```bash
git add apps/client/src/pages/dashboard/_components/sidebar.tsx
git commit -m "feat: add Agent Chat sidebar tab with ⇧A shortcut"
```

---

### Task 11: Verify it all works

**Step 1: Install the SDK**

```bash
pnpm add @langchain/langgraph-sdk
```

**Step 2: Start the LangGraph server** (in a separate terminal from `apps/graphs/`)

```bash
cd apps/graphs
langgraph dev
```

Expected: Server running at `http://localhost:2024`

**Step 3: Start the dev server**

```bash
pnpm dev
```

**Step 4: Navigate to the chat page**

Open `http://localhost:5173/dashboard/agent-chat` and verify:
- [ ] Sidebar shows "Agent Chat" between Billing and Settings
- [ ] Page loads with empty state (robot icon + prompt text)
- [ ] Type a query (e.g. "What's the latest iPhone price?") and press Enter
- [ ] Loading dots appear while graph runs
- [ ] AI response renders with markdown
- [ ] Scroll-to-bottom works on long responses
- [ ] `⇧A` shortcut navigates to the page

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: agent chat UI — connect to scraper_graph LangGraph agent"
```

---

## Notes

- The `scraper_graph` state uses `query`/`search_results`/`result` (not `messages`), so conversation history is UI-only — each run is independent.
- If `VITE_LANGGRAPH_URL` is not set, it defaults to `http://localhost:2024`.
- The LangGraph server must be running locally (`langgraph dev` in `apps/graphs/`).
- `react-markdown` and `remark-gfm` may need to be installed — check first in Task 5.
- The `field-sizing-content` Tailwind class requires Tailwind v4 or the `@tailwindcss/forms` plugin — if it doesn't work, replace with `overflow-hidden` and handle height manually.
