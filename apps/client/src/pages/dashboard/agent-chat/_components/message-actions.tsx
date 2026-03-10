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
