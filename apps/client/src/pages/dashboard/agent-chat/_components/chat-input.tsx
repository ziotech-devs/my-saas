import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react";
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
