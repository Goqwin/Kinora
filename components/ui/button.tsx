import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-fg)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)]",
        ghost:
          "text-[var(--ink)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
        crisis:
          "border border-[var(--crisis-border)] bg-[var(--crisis-bg)] text-[var(--crisis-fg)] hover:bg-[var(--crisis-bg-hover)]",
      },
      size: {
        default: "h-11 px-5 rounded-[var(--radius-md)]",
        sm: "h-9 rounded-[var(--radius-sm)] px-3.5 text-xs",
        lg: "h-12 rounded-[var(--radius-md)] px-6 text-base",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
