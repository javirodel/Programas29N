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

function safeHttpHref(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
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

  const combinedBibliography = [
    ...sourcesFor.map((src) => ({ ...src, stance: "A favor" as const })),
    ...sourcesAgainst.map((src) => ({ ...src, stance: "En contra" as const })),
  ].filter((src, idx, arr) => {
    const safeUrl = safeHttpHref(src.url);
    if (!safeUrl) return false;
    return arr.findIndex((other) => other.url === src.url) === idx;
  });

  return (
    <details open={defaultOpen} className={cn("accordion-panel group text-sm", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-[4px] border border-line bg-surface-muted/70 px-2.5 py-1.5 text-xs font-semibold text-ink-secondary transition-colors select-none hover:border-line-strong hover:bg-surface-muted hover:text-ink">
        <span
          aria-hidden="true"
          className="inline-block font-mono text-xs transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
        <span>Explicación sencilla</span>
        <span className="font-normal text-ink-muted">· A favor y en contra</span>
        {combinedBibliography.length > 0 ? (
          <span className="rounded-[2px] border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
            {combinedBibliography.length} {combinedBibliography.length === 1 ? "fuente" : "fuentes"}
          </span>
        ) : null}
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
            </div>
          ) : null}

          {hasAgainst ? (
            <div className="rounded-[3px] border border-[var(--color-status-contra-border)] bg-[var(--color-status-contra-bg)] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-status-contra-fg)]">
                <span aria-hidden="true">−</span>
                <span>En contra</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink sm:text-sm">{argumentsAgainst}</p>
            </div>
          ) : null}
        </div>

        {combinedBibliography.length > 0 ? (
          <details className="rounded-[3px] border border-line bg-canvas p-2.5 text-xs">
            <summary className="cursor-pointer font-bold text-ink select-none hover:text-civic">
              Bibliografía y fuentes verificadas ({combinedBibliography.length})
            </summary>
            <ul className="mt-2.5 space-y-2 border-t border-line pt-2">
              {combinedBibliography.map((src) => {
                const safeUrl = safeHttpHref(src.url);
                if (!safeUrl) return null;
                return (
                  <li
                    key={safeUrl}
                    className="flex flex-col gap-0.5 rounded-[3px] bg-surface-muted/45 px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-ink">
                        {src.publisher}
                        {src.date ? (
                          <span className="ml-1.5 font-mono font-normal text-ink-muted">
                            ({src.date})
                          </span>
                        ) : null}
                      </span>
                      <span className="rounded-[2px] border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary">
                        {src.stance}
                      </span>
                    </div>
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-civic underline underline-offset-4 hover:text-ink"
                    >
                      {src.title} ↗
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        ) : (
          <p className="text-[11px] text-ink-muted">
            Nota editorial: resumen divulgativo de contexto; sin documentos bibliográficos externos
            enlazados todavía en esta medida.
          </p>
        )}
      </div>
    </details>
  );
}
