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
