import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        neutral:
          "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-fg-muted)] border border-[color:var(--color-border)]",
        accent:
          "bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/30",
        success:
          "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border border-[color:var(--color-success)]/30",
        warn:
          "bg-[color:var(--color-warn)]/10 text-[color:var(--color-warn)] border border-[color:var(--color-warn)]/30",
        danger:
          "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/30",
        brand:
          "bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
