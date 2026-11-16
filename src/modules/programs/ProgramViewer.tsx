"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProposal, Theme } from "@/modules/corpus/types";
import { Button } from "@/modules/ui/components/Button";
import { Card } from "@/modules/ui/components/Card";
import { EvidenceModal } from "@/modules/ui/components/EvidenceModal";
import { ProposalAnalysisDisclosure } from "@/modules/ui/components/ProposalAnalysisDisclosure";
import { ReadingProgressBar } from "@/modules/ui/components/ReadingProgressBar";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";

interface ProgramViewerProps {
  partyName: string;
  shortName: string;
  accentColor: string;
  themes: Theme[];
  publishedProposals: PublicProposal[];
}

const INITIAL_BLOCK_ITEMS = 3;
const TEXT_COLLAPSE_LIMIT = 220;

export function ProgramViewer({
  partyName,
  shortName,
  accentColor,
  themes,
  publishedProposals,
}: ProgramViewerProps) {
  const [textFilter, setTextFilter] = useState("");
  const [singleThemeId, setSingleThemeId] = useState<string>("all");
  const [activeEvidence, setActiveEvidence] = useState<PublicProposal | null>(null);
  const [expandedTextIds, setExpandedTextIds] = useState<Record<string, boolean>>({});
  const [expandedBlockLimits, setExpandedBlockLimits] = useState<Record<string, boolean>>({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string>("");
  const [isStuck, setIsStuck] = useState(false);

  const bannerSentinelRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);

  const grouped = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    const filtered = publishedProposals.filter((proposal) => {
      if (singleThemeId !== "all" && proposal.theme_id !== singleThemeId) {
        return false;
      }
      if (!q) return true;
      return (
        proposal.official_text.text.toLowerCase().includes(q) ||
        proposal.title.text.toLowerCase().includes(q) ||
        proposal.legacy_id.toLowerCase().includes(q)
      );
    });

    const themeOrderMap = new Map(themes.map((t) => [t.id, t]));
    const buckets = new Map<string, PublicProposal[]>();
    for (const item of filtered) {
      const list = buckets.get(item.theme_id) ?? [];
      list.push(item);
      buckets.set(item.theme_id, list);
    }

    return Array.from(buckets.entries())
      .map(([themeId, items]) => ({
        theme: themeOrderMap.get(themeId) ?? {
          id: themeId,
          legacy_id: themeId,
          order: 99,
          is_canonical: false,
          title: themeId,
          legacy_title: themeId,
          description: "",
        },
        items,
      }))
      .sort((a, b) => a.theme.order - b.theme.order);
  }, [publishedProposals, singleThemeId, textFilter, themes]);

  const allThemeSections = useMemo(() => {
    const themeOrderMap = new Map(themes.map((t) => [t.id, t]));
    const counts = new Map<string, number>();
    for (const p of publishedProposals) {
      counts.set(p.theme_id, (counts.get(p.theme_id) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({
        theme: themeOrderMap.get(id) ?? {
          id,
          legacy_id: id,
          order: 99,
          is_canonical: false,
          title: id,
          legacy_title: id,
          description: "",
        },
        count,
      }))
      .sort((a, b) => a.theme.order - b.theme.order);
  }, [publishedProposals, themes]);

  const currentThemeId = useMemo(() => {
    if (singleThemeId !== "all") return singleThemeId;
    if (activeThemeId && grouped.some((g) => g.theme.id === activeThemeId)) {
      return activeThemeId;
    }
    return grouped[0]?.theme.id ?? "";
  }, [singleThemeId, activeThemeId, grouped]);

  const currentThemeIndex = grouped.findIndex((g) => g.theme.id === currentThemeId);
  const currentGroup = grouped[currentThemeIndex] ?? grouped[0];

  // Detectar si el banner sticky está fijado arriba
  useEffect(() => {
    const sentinel = bannerSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-58px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Scrollspy sobre cada bloque temático
  useEffect(() => {
    if (grouped.length === 0) return;

    const sectionElements = grouped
      .map((g) => document.getElementById(`tema-${g.theme.id}`))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topMost = visible[0];
        if (!topMost) return;
        const id = topMost.target.id.replace(/^tema-/, "");
        setActiveThemeId(id);
      },
      {
        rootMargin: "-155px 0px -65% 0px",
        threshold: 0,
      },
    );

    for (const el of sectionElements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [grouped]);

  // Centrar únicamente el carril horizontal sin interferir con el scroll vertical de la ventana
  useEffect(() => {
    const rail = railRef.current;
    if (!currentThemeId || !rail) return;
    const activeLink = rail.querySelector<HTMLElement>(`[data-theme-pill="${currentThemeId}"]`);
    if (!activeLink) return;
    const left = activeLink.offsetLeft - rail.clientWidth / 2 + activeLink.offsetWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [currentThemeId]);

  // Soporte de enlace directo a #tema-[id] y #medida-[id]
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#tema-")) {
        const themeId = decodeURIComponent(hash.slice("#tema-".length));
        setSingleThemeId("all");
        setCollapsedBlocks((prev) => ({ ...prev, [themeId]: false }));
        setActiveThemeId(themeId);
        return;
      }
      if (!hash.startsWith("#medida-")) return;
      const targetId = decodeURIComponent(hash.slice("#medida-".length));
      const match = publishedProposals.find((p) => p.id === targetId);
      if (!match) return;
      setSingleThemeId("all");
      setCollapsedBlocks((prev) => ({ ...prev, [match.theme_id]: false }));
      setExpandedBlockLimits((prev) => ({ ...prev, [match.theme_id]: true }));
      setActiveThemeId(match.theme_id);
      setHighlightedId(targetId);
      requestAnimationFrame(() => {
        setTimeout(() => {
          document
            .getElementById(`medida-${targetId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 70);
      });
    };
    const frame = requestAnimationFrame(applyHash);
    window.addEventListener("hashchange", applyHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", applyHash);
    };
  }, [publishedProposals]);

  const handleCopyProposalLink = async (proposal: PublicProposal) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#medida-${proposal.id}`;
    try {
      await navigator.clipboard?.writeText(url);
      setCopiedId(proposal.id);
      setTimeout(() => {
        setCopiedId((cur) => (cur === proposal.id ? null : cur));
      }, 2000);
    } catch {
      // Silencio si el navegador restringe el portapapeles
    }
  };

  const hasActiveSearch = textFilter.trim().length > 0;

  return (
    <div className="sticky-topic-parent space-y-6">
      <div ref={bannerSentinelRef} className="h-px w-full" aria-hidden="true" />

      {/* Banner superior sticky que cambia dinámicamente de tema al hacer scroll */}
      <div className={`sticky-topic-banner ${isStuck ? "is-stuck" : ""}`}>
        <div className="sticky-topic-banner-inner overflow-hidden rounded-2xl border border-line bg-surface/95 backdrop-blur">
          <ReadingProgressBar accentColor={accentColor} />

          <div className="space-y-2 p-2.5 sm:space-y-3 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Indicador dinámico del tema que se está leyendo */}
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-8 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    {grouped.length > 0 && currentGroup
                      ? `Viendo bloque ${Math.max(1, currentThemeIndex + 1)} de ${grouped.length} · ${shortName}`
                      : `Explorador de ${shortName}`}
                  </p>
                  {currentGroup ? (
                    <div
                      key={currentGroup.theme.id}
                      className="topic-swap flex flex-wrap items-baseline gap-2"
                    >
                      <h2 className="truncate text-base font-extrabold text-ink sm:text-lg">
                        {currentGroup.theme.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-secondary">
                        {currentGroup.items.length}{" "}
                        {currentGroup.items.length === 1 ? "medida" : "medidas"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-ink-secondary">Sin coincidencias</p>
                  )}
                </div>
              </div>

              {/* Buscador y filtro rápido */}
              <div className="flex flex-wrap items-center gap-2">
                {singleThemeId !== "all" ? (
                  <Button size="sm" variant="secondary" onClick={() => setSingleThemeId("all")}>
                    Ver los {allThemeSections.length} bloques seguidos
                  </Button>
                ) : null}

                <label htmlFor="program-text-filter" className="sr-only">
                  Buscar medida en {shortName}
                </label>
                <input
                  id="program-text-filter"
                  type="search"
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  placeholder={`Buscar en ${shortName}…`}
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted sm:w-56"
                />
              </div>
            </div>

            {/* Carril horizontal Scrollspy con todos los temas */}
            <nav
              ref={railRef}
              aria-label="Índice de temas del programa"
              className="scrollspy-rail flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
            >
              {allThemeSections.map(({ theme, count }) => {
                const isCurrent = currentThemeId === theme.id;
                const href = `#tema-${theme.id}`;

                return (
                  <a
                    key={theme.id}
                    href={href}
                    data-theme-pill={theme.id}
                    aria-current={isCurrent ? "true" : "false"}
                    onClick={(e) => {
                      setCollapsedBlocks((prev) => ({ ...prev, [theme.id]: false }));
                      if (singleThemeId !== "all") {
                        e.preventDefault();
                        setSingleThemeId("all");
                        setActiveThemeId(theme.id);
                        requestAnimationFrame(() => {
                          setTimeout(() => {
                            document
                              .getElementById(`tema-${theme.id}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 40);
                        });
                        return;
                      }
                      setActiveThemeId(theme.id);
                    }}
                    className={`scrollspy-link inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-3 py-1 font-medium transition-colors ${
                      isCurrent
                        ? "target-current border-ink bg-ink text-canvas font-bold"
                        : "border-line bg-canvas text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    <span>{theme.title}</span>
                    <span className="opacity-75">{count}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Flujo continuo de bloques y medidas (sensible al scroll) */}
      {grouped.length === 0 ? (
        <Card className="py-12 text-center text-base text-ink-secondary">
          No se encontraron medidas para «{textFilter}» en {shortName}.
        </Card>
      ) : (
        <div
          key={`${singleThemeId}::${textFilter.trim().toLowerCase()}`}
          className="animate-panel-switch space-y-12 sm:space-y-14"
        >
          {grouped.map(({ theme, items }, groupIdx) => {
            const isBlockOpen =
              singleThemeId !== "all" || hasActiveSearch || !collapsedBlocks[theme.id];
            const showAllInBlock =
              hasActiveSearch || singleThemeId !== "all" || Boolean(expandedBlockLimits[theme.id]);
            const visibleItems = showAllInBlock ? items : items.slice(0, INITIAL_BLOCK_ITEMS);

            return (
              <ScrollReveal
                key={theme.id}
                delayMs={groupIdx === 0 ? 0 : Math.min(groupIdx, 4) * 35}
              >
                <section
                  id={`tema-${theme.id}`}
                  tabIndex={-1}
                  aria-labelledby={`tema-heading-${theme.id}`}
                  style={{ borderTopColor: accentColor }}
                  className="scroll-mt-44 rounded-xl border border-t-4 border-line bg-surface p-4 shadow-xs outline-none sm:p-6"
                >
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 rounded-lg border border-line/70 bg-surface-muted/50 px-4 py-3.5 sm:px-5 sm:py-4">
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                        Bloque temático {groupIdx + 1} de {grouped.length}
                      </p>
                      <h3
                        id={`tema-heading-${theme.id}`}
                        className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
                      >
                        {theme.title}
                      </h3>
                      {theme.description ? (
                        <p className="mt-1 text-sm text-ink-muted">{theme.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="rounded-[3px] border border-line bg-canvas px-2.5 py-1 font-semibold text-ink-secondary">
                        {items.length} {items.length === 1 ? "medida" : "medidas"}
                      </span>
                      {singleThemeId === "all" && !hasActiveSearch ? (
                        <button
                          type="button"
                          aria-expanded={isBlockOpen}
                          onClick={() =>
                            setCollapsedBlocks((prev) => ({
                              ...prev,
                              [theme.id]: isBlockOpen,
                            }))
                          }
                          className="rounded-[3px] border border-line-strong bg-canvas px-2.5 py-1 font-bold text-ink transition-colors hover:border-ink"
                        >
                          {isBlockOpen
                            ? "Ocultar medidas ↑"
                            : `Desplegar ${items.length} medidas ↓`}
                        </button>
                      ) : null}
                      {singleThemeId === "all" && grouped.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setSingleThemeId(theme.id)}
                          className="font-semibold text-ink underline underline-offset-4 hover:text-civic"
                        >
                          Aislar ›
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isBlockOpen ? (
                    <div className="animate-panel-switch space-y-4">
                      {visibleItems.map((proposal) => {
                        const primaryEvidence = proposal.evidence[0];
                        const fullText = proposal.official_text.text;
                        const isLong = fullText.length > TEXT_COLLAPSE_LIMIT;
                        const isTextExpanded = Boolean(expandedTextIds[proposal.id]);
                        const displayText =
                          isLong && !isTextExpanded
                            ? `${fullText.slice(0, TEXT_COLLAPSE_LIMIT).trimEnd()}…`
                            : fullText;

                        const isHighlighted = highlightedId === proposal.id;
                        return (
                          <article
                            key={proposal.id}
                            id={`medida-${proposal.id}`}
                            className={`space-y-3 rounded-lg border p-4 transition-colors sm:p-5 ${
                              isHighlighted
                                ? "border-civic bg-civic-subtle/30"
                                : "border-line/80 bg-canvas/70 hover:border-line-strong"
                            }`}
                          >
                            {isLong ? (
                              <button
                                type="button"
                                aria-expanded={isTextExpanded}
                                onClick={() => {
                                  if (window.getSelection()?.toString()) return;
                                  setExpandedTextIds((prev) => ({
                                    ...prev,
                                    [proposal.id]: !isTextExpanded,
                                  }));
                                }}
                                className="block w-full cursor-pointer space-y-3 text-left"
                              >
                                <div className="flex items-baseline gap-2.5">
                                  <span className="shrink-0 rounded-[3px] border border-line bg-surface-muted px-2 py-0.5 font-mono text-xs font-bold text-ink-secondary">
                                    #{proposal.extraction_number}
                                  </span>
                                  {proposal.title.text ? (
                                    <h4 className="text-base font-bold leading-snug text-ink sm:text-lg">
                                      {proposal.title.text}
                                    </h4>
                                  ) : null}
                                </div>

                                <div className="max-w-[70ch] space-y-2 font-serif text-[15px] leading-relaxed text-ink-secondary sm:text-base">
                                  <p
                                    lang={proposal.official_text.language}
                                    className="whitespace-pre-line"
                                  >
                                    «{displayText}»
                                  </p>
                                  <span className="inline-block font-sans text-xs font-semibold text-ink underline underline-offset-4 hover:text-civic">
                                    {isTextExpanded
                                      ? "Mostrar resumen literal"
                                      : "Leer medida completa"}
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-baseline gap-2.5">
                                  <span className="shrink-0 rounded-[3px] border border-line bg-surface-muted px-2 py-0.5 font-mono text-xs font-bold text-ink-secondary">
                                    #{proposal.extraction_number}
                                  </span>
                                  {proposal.title.text ? (
                                    <h4 className="text-base font-bold leading-snug text-ink sm:text-lg">
                                      {proposal.title.text}
                                    </h4>
                                  ) : null}
                                </div>

                                <div className="max-w-[70ch] font-serif text-[15px] leading-relaxed text-ink-secondary sm:text-base">
                                  <p
                                    lang={proposal.official_text.language}
                                    className="whitespace-pre-line"
                                  >
                                    «{displayText}»
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 pt-1">
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                {primaryEvidence ? (
                                  <a
                                    href={primaryEvidence.pdf_href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block rounded-[3px] border border-line px-2.5 py-1 font-medium text-ink-secondary hover:border-ink hover:text-ink"
                                  >
                                    Programa de 2026, pág. {primaryEvidence.pages[0] ?? 1} ↗
                                  </a>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handleCopyProposalLink(proposal)}
                                  className="font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                                >
                                  {copiedId === proposal.id ? "Enlace copiado ✓" : "Copiar enlace"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveEvidence(proposal)}
                                  className="font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                                >
                                  Ver cita documental
                                </button>
                              </div>

                              <ProposalAnalysisDisclosure
                                compact
                                summary={proposal.ai_annotations.summary}
                                argumentsFor={proposal.ai_annotations.arguments_for}
                                argumentsAgainst={proposal.ai_annotations.arguments_against}
                                sourcesFor={proposal.ai_annotations.sources_for}
                                sourcesAgainst={proposal.ai_annotations.sources_against}
                              />
                            </div>
                          </article>
                        );
                      })}

                      {!showAllInBlock && items.length > INITIAL_BLOCK_ITEMS ? (
                        <div className="pt-5 text-center">
                          <Button
                            size="md"
                            variant="secondary"
                            onClick={() =>
                              setExpandedBlockLimits((prev) => ({
                                ...prev,
                                [theme.id]: true,
                              }))
                            }
                          >
                            + Ver las {items.length - INITIAL_BLOCK_ITEMS} medidas restantes de{" "}
                            {theme.title}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      <EvidenceModal
        proposal={activeEvidence}
        partyName={partyName}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
