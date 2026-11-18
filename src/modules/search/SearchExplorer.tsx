"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicProposal } from "@/modules/corpus/types";
import type { SearchHit, SearchResult } from "@/modules/search/engine";
import { stripDiacritics } from "@/modules/search/text-utils";
import { EvidenceModal } from "@/modules/ui/components/EvidenceModal";
import { ProposalAnalysisDisclosure } from "@/modules/ui/components/ProposalAnalysisDisclosure";
import { getPartyVisual } from "@/modules/ui/party-colors";

const QUICK_SEARCH_CHIPS = [
  "vivienda",
  "pensiones",
  "impuestos",
  "sanidad",
  "educación",
  "empleo",
  "energía",
  "inmigración",
];

function hitToPublicProposal(hit: SearchHit): PublicProposal {
  return {
    id: hit.id,
    legacy_id: hit.legacyId,
    program_id: `program-${hit.partyId}`,
    party_id: hit.partyId,
    extraction_number: Number.parseInt(hit.id.split("-").at(-1) ?? "1", 10) || 1,
    official_number: { value: null, verification: "no_verificado", origin: "detallado_ia" },
    kind: "propuesta",
    title: { text: hit.title, origin: "detallado_ia" },
    official_text: { text: hit.officialText, origin: "detallado_ia", language: hit.language },
    original_section: {
      value: hit.originalSection,
      verification: "no_verificado",
      origin: "detallado_ia",
    },
    theme_id: hit.themeId,
    theme_assignment: { method: "ia", reviewed: true },
    evidence:
      hit.pages.length > 0
        ? [
            {
              source_document_id: hit.partyId,
              pages: hit.pages,
              snippet: hit.snippet,
              docling_refs: [],
              match: "literal",
              method: "manual",
              verified: true,
              pdf_href: hit.pdfHref,
            },
          ]
        : [],
    review: { status: "verificada", history: [] },
    ai_annotations: {
      summary: hit.aiSummary,
      arguments_for: hit.aiArgumentsFor,
      arguments_against: hit.aiArgumentsAgainst,
      sources_for: hit.aiSourcesFor,
      sources_against: hit.aiSourcesAgainst,
      fact_check: { status: hit.aiFactCheckStatus },
    },
    flags: [],
  };
}

interface FilterPartyOption {
  id: string;
  shortName: string;
  name: string;
}

interface FilterThemeOption {
  id: string;
  title: string;
}

interface SearchExplorerProps {
  initialResult: SearchResult;
  initialParties: string[];
  initialThemes: string[];
  parties: FilterPartyOption[];
  themes: FilterThemeOption[];
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const tokens = stripDiacritics(query)
    .toLowerCase()
    .split(/[^a-z0-9ñç]+/)
    .filter((t) => t.length >= 2);

  if (tokens.length === 0) {
    return <>{text}</>;
  }

  const lowerNormalized = stripDiacritics(text).toLowerCase();
  const matches: Array<{ start: number; end: number }> = [];

  for (const token of tokens) {
    let idx = lowerNormalized.indexOf(token);
    while (idx !== -1 && matches.length < 40) {
      matches.push({ start: idx, end: idx + token.length });
      idx = lowerNormalized.indexOf(token, idx + token.length);
    }
  }

  if (matches.length === 0) {
    return <>{text}</>;
  }

  matches.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) {
      last.end = Math.max(last.end, m.end);
    } else {
      merged.push({ ...m });
    }
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i];
    if (!seg) continue;
    if (seg.start > cursor) {
      nodes.push(text.slice(cursor, seg.start));
    }
    nodes.push(
      <mark
        key={`${seg.start}-${seg.end}`}
        className="rounded-[2px] bg-[var(--color-highlight-bg)] px-0.5 text-ink"
      >
        {text.slice(seg.start, seg.end)}
      </mark>,
    );
    cursor = seg.end;
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <>{nodes}</>;
}

export function SearchExplorer({
  initialResult,
  initialParties,
  initialThemes,
  parties,
  themes,
}: SearchExplorerProps) {
  const [query, setQuery] = useState(initialResult.query);
  const [selectedParties, setSelectedParties] = useState<string[]>(initialParties);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initialThemes);
  const [activeEvidence, setActiveEvidence] = useState<PublicProposal | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(
    () => initialParties.length > 0 || initialThemes.length > 0,
  );
  const [visibleCount, setVisibleCount] = useState(8);
  const [expandedHitIds, setExpandedHitIds] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<SearchResult>(initialResult);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const didMountRef = useRef(false);

  const partyNameMap = new Map(parties.map((p) => [p.id, p.name]));

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (selectedParties.length > 0) params.set("partido", selectedParties.join(","));
      if (selectedThemes.length > 0) params.set("bloque", selectedThemes.join(","));

      const qs = params.toString();
      const nextUrl = qs ? `/buscar?${qs}` : "/buscar";
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch(`/api/search?${qs}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("No se pudo ejecutar la búsqueda.");
        }
        const data = (await response.json()) as SearchResult;
        setResult(data);
        setVisibleCount(8);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setErrorMsg("No se pudo actualizar la búsqueda. Inténtalo de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedParties, selectedThemes]);

  const toggleParty = (id: string) => {
    setSelectedParties((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectTheme = (themeId: string) => {
    setSelectedThemes((prev) => (themeId ? (prev[0] === themeId ? [] : [themeId]) : []));
  };

  const resetAll = () => {
    setQuery("");
    setSelectedParties([]);
    setSelectedThemes([]);
  };

  const activeFilterCount = selectedParties.length + selectedThemes.length;
  const resultSignature = `${result.query}::${selectedParties.join(",")}::${selectedThemes.join(",")}`;

  return (
    <div className="space-y-8">
      {/* Barra superior editorial con entrada de búsqueda subrayada */}
      <div
        className={
          filtersExpanded
            ? "space-y-5 border-b border-line pb-6"
            : "sticky top-14 z-20 -mx-4 border-y border-line bg-canvas/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        }
      >
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
          role="search"
          aria-label="Buscador de propuestas del corpus 29N"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="flex-1">
              <label htmlFor="global-search-input" className="sr-only">
                Buscar en los {parties.length} programas
              </label>
              <input
                id="global-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej.: alquiler, nuclear, OTAN, pensiones, autónomos…"
                className="w-full border-b-[3px] border-ink bg-transparent pb-2 text-xl font-bold text-ink placeholder:text-ink-muted/50 focus:outline-none sm:text-2xl"
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={filtersExpanded}
                onClick={() => setFiltersExpanded((prev) => !prev)}
                className="rounded-[3px] border border-line-strong bg-surface px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:border-ink"
              >
                {filtersExpanded
                  ? "Ocultar filtros"
                  : `Filtros${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
              </button>
              {query || activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-2 py-2 text-xs font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>

          {filtersExpanded ? (
            <div className="animate-panel-switch space-y-5 pt-1">
              {/* Sugerencias rápidas */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="mr-1 text-ink-muted">Sugerencias:</span>
                {QUICK_SEARCH_CHIPS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-[3px] border border-line bg-surface px-2.5 py-1 font-semibold text-ink-secondary transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Candidaturas */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Filtrar por candidatura
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {parties.map((party) => {
                    const active = selectedParties.includes(party.id);
                    const count = result.facets.byParty[party.id] ?? 0;
                    const visual = getPartyVisual(party.id);
                    return (
                      <button
                        key={party.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleParty(party.id)}
                        style={{ borderTopColor: visual.bg }}
                        className={`rounded-[3px] border border-t-4 px-2.5 py-1 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 ${
                          active
                            ? "border-x-ink border-b-ink bg-ink font-bold text-canvas"
                            : "border-x-line border-b-line bg-surface text-ink-secondary hover:text-ink"
                        }`}
                      >
                        {party.shortName} ({count})
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Carril de píldoras de temas */}
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Filtrar por tema
                </legend>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    aria-pressed={selectedThemes.length === 0}
                    onClick={() => selectTheme("")}
                    className={`shrink-0 rounded-[3px] border px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedThemes.length === 0
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    Todos
                  </button>
                  {themes.map((theme) => {
                    const count = result.facets.byTheme[theme.id] ?? 0;
                    if (count === 0 && !selectedThemes.includes(theme.id)) return null;
                    const active = selectedThemes.includes(theme.id);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectTheme(theme.id)}
                        className={`shrink-0 rounded-[3px] border px-3 py-1 text-xs font-semibold transition-colors ${
                          active
                            ? "border-ink bg-ink font-bold text-canvas"
                            : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                        }`}
                      >
                        {theme.title} ({count})
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          ) : null}
        </form>
      </div>

      {/* Estado de resultados + barra animada */}
      <div aria-live="polite" className="space-y-2 text-sm">
        {loading ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="loading-bar-indeterminate h-full w-1/2 rounded-full bg-civic" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 font-medium text-ink-secondary">
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 animate-ping rounded-full bg-civic"
                />
                <span>Buscando en 6.123 propuestas oficiales…</span>
              </>
            ) : (
              `${result.total.toLocaleString("es-ES")} ${
                result.total === 1 ? "propuesta encontrada" : "propuestas encontradas"
              }${result.total > result.hits.length ? ` (mostrando las primeras ${result.hits.length})` : ""}`
            )}
          </p>
          {errorMsg ? <p className="font-medium text-red-700">{errorMsg}</p> : null}
        </div>
      </div>

      {loading && result.hits.length === 0 ? (
        <div className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="space-y-3 rounded-[3px] border border-line bg-surface p-5">
              <div className="skeleton-shimmer h-4 w-36 rounded-[3px]" />
              <div className="skeleton-shimmer h-6 w-3/4 rounded-[3px]" />
              <div className="skeleton-shimmer h-4 w-full rounded-[3px]" />
              <div className="skeleton-shimmer h-4 w-5/6 rounded-[3px]" />
            </div>
          ))}
        </div>
      ) : result.hits.length === 0 ? (
        <div className="rounded-[3px] border border-line bg-surface py-10 text-center">
          <p className="font-bold text-ink">Sin coincidencias con los filtros actuales.</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Prueba con términos menos restrictivos o limpia los filtros de partido y tema.
          </p>
        </div>
      ) : (
        <div className={`space-y-5 transition-opacity duration-150 ${loading ? "opacity-60" : ""}`}>
          <div key={resultSignature} className="animate-panel-switch space-y-4">
            {result.hits.slice(0, visibleCount).map((hit: SearchHit) => {
              const visual = getPartyVisual(hit.partyId);
              const isLong = hit.officialText.length > 240;
              const isExpanded = Boolean(expandedHitIds[hit.id]);
              const shownText =
                isLong && !isExpanded
                  ? `${hit.officialText.slice(0, 240).trimEnd()}…`
                  : hit.officialText;

              return (
                <article
                  key={hit.id}
                  style={{ borderLeftColor: visual.bg }}
                  className="editorial-card space-y-3 rounded-[3px] border border-l-4 border-line bg-surface p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/programas/${hit.partyId}`}
                        className="font-extrabold uppercase tracking-wider text-ink hover:text-civic hover:underline"
                      >
                        {hit.partyShortName}
                      </Link>
                      <span aria-hidden="true" className="text-ink-muted">
                        ·
                      </span>
                      <span className="font-medium text-ink-muted">{hit.themeTitle}</span>
                    </div>
                  </div>

                  {isLong ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        if (window.getSelection()?.toString()) return;
                        setExpandedHitIds((prev) => ({
                          ...prev,
                          [hit.id]: !isExpanded,
                        }));
                      }}
                      className="block w-full cursor-pointer space-y-3 text-left"
                    >
                      {hit.title ? (
                        <h2 className="text-lg font-bold leading-snug text-ink sm:text-xl">
                          <HighlightedText text={hit.title} query={query} />
                        </h2>
                      ) : null}

                      <div className="max-w-[70ch] space-y-1.5 font-serif text-[15px] leading-relaxed text-ink-secondary sm:text-base">
                        <p lang={hit.language} className="whitespace-pre-line">
                          «<HighlightedText text={shownText} query={query} />»
                        </p>
                        <span className="inline-block font-sans text-xs font-semibold text-ink underline underline-offset-4 hover:text-civic">
                          {isExpanded ? "Mostrar menos" : "Leer texto completo"}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {hit.title ? (
                        <h2 className="text-lg font-bold leading-snug text-ink sm:text-xl">
                          <HighlightedText text={hit.title} query={query} />
                        </h2>
                      ) : null}

                      <div className="max-w-[70ch] font-serif text-[15px] leading-relaxed text-ink-secondary sm:text-base">
                        <p lang={hit.language} className="whitespace-pre-line">
                          «<HighlightedText text={shownText} query={query} />»
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <a
                      href={hit.pdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-[3px] border border-line px-2.5 py-1 font-medium text-ink-secondary hover:border-ink hover:text-ink"
                    >
                      Programa de 2026, pág. {hit.pages[0] ?? 1} ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveEvidence(hitToPublicProposal(hit))}
                      className="font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                    >
                      Ver cita documental
                    </button>
                    <Link
                      href={`/programas/${hit.partyId}#medida-${hit.id}`}
                      className="ml-auto font-bold text-ink underline underline-offset-4 hover:text-civic"
                    >
                      Ver en programa →
                    </Link>
                  </div>

                  <ProposalAnalysisDisclosure
                    compact
                    summary={hit.aiSummary}
                    argumentsFor={hit.aiArgumentsFor}
                    argumentsAgainst={hit.aiArgumentsAgainst}
                    sourcesFor={hit.aiSourcesFor}
                    sourcesAgainst={hit.aiSourcesAgainst}
                  />
                </article>
              );
            })}
          </div>

          {result.hits.length > visibleCount ? (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="rounded-[3px] border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-ink"
              >
                Mostrar 10 resultados más (quedan {result.hits.length - visibleCount})
              </button>
            </div>
          ) : null}
        </div>
      )}

      <EvidenceModal
        proposal={activeEvidence}
        partyName={activeEvidence ? partyNameMap.get(activeEvidence.party_id) : undefined}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
