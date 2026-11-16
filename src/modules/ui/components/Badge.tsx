import type { ReactNode } from "react";
import { cn } from "@/modules/ui/cn";

export type BadgeVariant = "verified" | "pending" | "neutral" | "civic";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  verified:
    "border-[var(--color-status-verified-border)] bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified-fg)]",
  pending:
    "border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-fg)]",
  neutral:
    "border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-fg)]",
  civic: "border-civic/30 bg-civic-subtle text-civic",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-tight",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
