import { useState } from "react";
import type { Message } from "@langchain/langgraph-sdk";
import { cn } from "@my-saas/utils";
import { useStreamContext } from "../_providers/stream-provider";
import type { AgentState } from "../_providers/stream-provider";
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
        optimisticValues: (prev: AgentState) => {
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
          <textarea
            value={editValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditValue(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmitEdit();
              }
            }}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
            autoFocus
          />
        ) : (
          <p className="px-4 py-3 rounded-2xl border bg-muted w-fit ml-auto whitespace-pre-wrap text-sm">
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
