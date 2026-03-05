import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center rounded-md text-sm font-semibold tracking-wide ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/80 hover:shadow-md",
        error:
          "bg-error text-error-foreground shadow-sm shadow-error/25 hover:-translate-y-0.5 hover:bg-error/90 hover:shadow-md hover:shadow-error/35",
        warning:
          "bg-warning text-warning-foreground shadow-sm shadow-warning/25 hover:-translate-y-0.5 hover:bg-warning/90 hover:shadow-md hover:shadow-warning/35",
        info: "bg-info text-info-foreground shadow-sm shadow-info/25 hover:-translate-y-0.5 hover:bg-info/90 hover:shadow-md hover:shadow-info/35",
        success:
          "bg-success text-success-foreground shadow-sm shadow-success/25 hover:-translate-y-0.5 hover:bg-success/90 hover:shadow-md hover:shadow-success/35",
        outline:
          "border border-secondary bg-transparent hover:-translate-y-0.5 hover:border-transparent hover:bg-secondary hover:text-secondary-foreground hover:shadow-sm",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-9 px-5",
        lg: "h-11 px-8 text-base",
        icon: "size-9",
      },
    },
    compoundVariants: [
      { variant: "link", size: "sm", className: "h-auto px-0" },
      { variant: "link", size: "md", className: "h-auto px-0" },
      { variant: "link", size: "lg", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
