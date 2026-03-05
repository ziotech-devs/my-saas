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
