import { PencilSimpleIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, useState } from "react";

type HumanMessageProps = {
  content: string;
  onEdit?: (newContent: string) => void;
};

export const HumanMessage = ({ content, onEdit }: HumanMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleConfirm = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onEdit?.(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") {
      setEditValue(content);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-xl">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            rows={2}
            className="w-full resize-none rounded-2xl bg-muted px-4 py-2 text-sm outline-none ring-2 ring-ring"
          />
          <div className="mt-1.5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditValue(content);
                setIsEditing(false);
              }}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="text-xs font-medium text-primary transition-colors hover:underline"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-end justify-end gap-1.5">
      {onEdit && (
        <button
          type="button"
          onClick={() => {
            setEditValue(content);
            setIsEditing(true);
          }}
          aria-label="Edit message"
          className="mb-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <PencilSimpleIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
      <p className="max-w-xl rounded-3xl bg-muted px-4 py-2 whitespace-pre-wrap text-sm">
        {content}
      </p>
    </div>
  );
};
