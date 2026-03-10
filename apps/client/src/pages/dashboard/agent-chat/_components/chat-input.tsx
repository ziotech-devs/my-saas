import { t } from "@lingui/macro";
import { Button } from "@my-saas/ui";
import { StopIcon } from "@phosphor-icons/react";
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
    <div className="bg-muted rounded-2xl border shadow-xs w-full">
      <form onSubmit={handleSubmit} className="grid grid-rows-[1fr_auto] gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          placeholder={t`Ask anything...`}
          disabled={isLoading}
          className="p-3.5 pb-0 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none text-sm placeholder:text-muted-foreground/60 min-h-[44px] disabled:opacity-50"
        />
        <div className="flex items-center justify-end p-2 pt-4">
          {isLoading ? (
            <Button type="button" onClick={onStop} className="transition-all shadow-md">
              <StopIcon className="size-4" />
              {t`Cancel`}
            </Button>
          ) : (
            <Button type="submit" disabled={!value.trim()} className="transition-all shadow-md">
              {t`Send`}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
