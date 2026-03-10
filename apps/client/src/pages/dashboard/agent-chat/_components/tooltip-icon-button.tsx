import { forwardRef } from "react";
import {
  Button,
  TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import type { ComponentPropsWithoutRef } from "react";

type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
};

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
  ({ children, tooltip, side = "bottom", className, ...rest }, ref) => (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            {...rest}
            className={cn("size-6 p-1", className)}
            ref={ref}
          >
            {children}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  ),
);

TooltipIconButton.displayName = "TooltipIconButton";
