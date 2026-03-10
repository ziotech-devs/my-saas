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
          <div className="rounded-2xl border bg-muted px-4 py-3 text-sm leading-relaxed">
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
