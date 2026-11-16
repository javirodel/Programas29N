import type { ReactNode } from "react";
import { cn } from "@/modules/ui/cn";

export type CalloutTone = "info" | "warning" | "verified";

const TONE_CLASSES: Record<CalloutTone, string> = {
  info: "border-civic/30 bg-civic-subtle text-ink",
  warning:
    "border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-bg)] text-ink",
  verified:
    "border-[var(--color-status-verified-border)] bg-[var(--color-status-verified-bg)] text-ink",
};

interface CalloutProps {
  title: string;
  children: ReactNode;
  tone?: CalloutTone;
  className?: string;
}

export function Callout({ title, children, tone = "info", className }: CalloutProps) {
  return (
    <div
      role="note"
      className={cn("rounded-lg border p-4 text-sm leading-relaxed", TONE_CLASSES[tone], className)}
    >
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-1 text-ink-secondary">{children}</div>
    </div>
  );
}
