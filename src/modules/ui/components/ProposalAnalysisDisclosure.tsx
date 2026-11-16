"use client";

import type { AnnotationSource } from "@/modules/corpus/types";
import { cn } from "@/modules/ui/cn";

interface ProposalAnalysisDisclosureProps {
  summary?: string;
  argumentsFor?: string;
  argumentsAgainst?: string;
  sourcesFor?: AnnotationSource[];
  sourcesAgainst?: AnnotationSource[];
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Desplegable ligero «Explicación sencilla» separado del texto literal oficial.
 */
export function ProposalAnalysisDisclosure({
  summary,
  argumentsFor,
  argumentsAgainst,
  sourcesFor = [],
  sourcesAgainst = [],
  defaultOpen = false,
  compact = false,
  className,
}: ProposalAnalysisDisclosureProps) {
  const hasSummary = Boolean(summary?.trim());
  const hasFor = Boolean(argumentsFor?.trim());
  const hasAgainst = Boolean(argumentsAgainst?.trim());

  if (!hasSummary && !hasFor && !hasAgainst) {
    return null;
  }

  return (
    <details open={defaultOpen} className={cn("accordion-panel group text-sm", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 py-1 text-xs font-semibold text-ink-secondary underline decoration-line-strong underline-offset-4 select-none hover:text-ink">
        <span
          aria-hidden="true"
          className="inline-block font-mono text-xs transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
        <span>Explicación sencilla</span>
        <span className="font-normal text-ink-muted">· A favor y en contra</span>
      </summary>

      <div className="animate-panel-switch mt-2.5 space-y-3 border-l-2 border-line-strong py-1 pl-4 text-ink-secondary">
        {hasSummary ? <p className="text-sm leading-relaxed text-ink">{summary}</p> : null}

        <div className={cn("grid gap-2.5", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          {hasFor ? (
            <div className="rounded-[3px] border border-[var(--color-status-verified-border)] bg-[var(--color-status-verified-bg)] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-status-verified-fg)]">
                <span aria-hidden="true">+</span>
                <span>A favor</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink sm:text-sm">{argumentsFor}</p>
              {sourcesFor.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--color-status-verified-border)]/60 pt-1.5 text-[11px]">
                  {sourcesFor.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--color-status-verified-fg)] hover:underline"
                        title={src.title}
                      >
                        {src.publisher} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {hasAgainst ? (
            <div className="rounded-[3px] border border-[var(--color-status-contra-border)] bg-[var(--color-status-contra-bg)] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-status-contra-fg)]">
                <span aria-hidden="true">−</span>
                <span>En contra</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink sm:text-sm">{argumentsAgainst}</p>
              {sourcesAgainst.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--color-status-contra-border)]/60 pt-1.5 text-[11px]">
                  {sourcesAgainst.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--color-status-contra-fg)] hover:underline"
                        title={src.title}
                      >
                        {src.publisher} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}
