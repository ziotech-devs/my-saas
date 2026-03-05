import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { ArrowUpIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { type FormEvent, type KeyboardEvent, useState } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
};

export const ChatInput = ({ onSend, isLoading, autoFocus }: ChatInputProps) => {
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
      className="flex items-end gap-3 rounded-2xl border bg-background px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
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
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !value.trim()}
        className="shrink-0 size-8 rounded-xl"
      >
        {isLoading ? (
          <SpinnerGapIcon className="size-4 animate-spin" />
        ) : (
          <ArrowUpIcon className="size-4" />
        )}
      </Button>
    </form>
  );
};
