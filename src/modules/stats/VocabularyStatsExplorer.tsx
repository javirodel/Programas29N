"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { ConceptRadarItem, MacroAreaId, PartyProgramAnalytics } from "@/modules/corpus/stats";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import { getPartyMeta, getPartyVisual } from "@/modules/ui/party-colors";

interface VocabularyStatsExplorerProps {
  analytics: PartyProgramAnalytics[];
  conceptRadar: ConceptRadarItem[];
}

type MainTab = "vocab" | "dna" | "style";
type ScopeFilter = "all" | "congress" | "estatal" | "autonomico";
type WordMode = "tfidf" | "frequent";
type RadarMetric = "mentions" | "density";
type StyleMetric = "words" | "proposals" | "density" | "vocabulary";
type DnaSort = "proposals" | "specialization" | MacroAreaId;

const MACRO_AREA_COLORS: Record<MacroAreaId, { color: string; shortLabel: string }> = {
  bienestar: { color: "var(--color-civic)", shortLabel: "Bienestar y vivienda" },
  economia: { color: "#b45309", shortLabel: "Economía e impuestos" },
  instituciones: { color: "#6d28d9", shortLabel: "Instituciones y territorio" },
  exterior: { color: "#047857", shortLabel: "Fronteras y defensa" },
};

function wordScaleClass(index: number): string {
  if (index === 0) return "text-xl font-extrabold text-ink sm:text-2xl";
  if (index <= 2) return "text-base font-bold text-ink sm:text-lg";
  if (index <= 6) return "text-sm font-semibold text-ink-secondary";
  return "text-xs font-medium text-ink-muted";
}

function runWithViewTransition(action: () => void) {
  if (typeof document !== "undefined") {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(action);
      return;
    }
  }
  action();
}

export function VocabularyStatsExplorer({ analytics, conceptRadar }: VocabularyStatsExplorerProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("vocab");
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    conceptRadar[0]?.id ?? "vivienda",
  );
  const [radarMetric, setRadarMetric] = useState<RadarMetric>("density");
  const [showAllRadarParties, setShowAllRadarParties] = useState<boolean>(false);
  const [wordMode, setWordMode] = useState<WordMode>("tfidf");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [termQuery, setTermQuery] = useState<string>("");
  const [dnaSort, setDnaSort] = useState<DnaSort>("proposals");
  const [styleMetric, setStyleMetric] = useState<StyleMetric>("words");

  const scopeCounts = useMemo(() => {
    let congress = 0;
    let estatal = 0;
    let autonomico = 0;
    for (const item of analytics) {
      const meta = getPartyMeta(item.partyId);
      if (meta.outgoingCongressSeats !== null) congress += 1;
      if (meta.scope === "estatal") estatal += 1;
      else autonomico += 1;
    }
    return { all: analytics.length, congress, estatal, autonomico };
  }, [analytics]);

  const activeConcept = useMemo(
    () => conceptRadar.find((c) => c.id === selectedConceptId) ?? conceptRadar[0],
    [conceptRadar, selectedConceptId],
  );

  const sortedConceptParties = useMemo(() => {
    if (!activeConcept) return [];
    const list = [...activeConcept.parties].sort((a, b) =>
      radarMetric === "mentions"
        ? b.mentions - a.mentions || b.per100Proposals - a.per100Proposals
        : b.per100Proposals - a.per100Proposals || b.mentions - a.mentions,
    );
    return showAllRadarParties ? list : list.slice(0, 8);
  }, [activeConcept, radarMetric, showAllRadarParties]);

  const maxConceptValue = useMemo(() => {
    if (sortedConceptParties.length === 0) return 1;
    return Math.max(
      1,
      ...sortedConceptParties.map((m) =>
        radarMetric === "mentions" ? m.mentions : m.per100Proposals,
      ),
    );
  }, [sortedConceptParties, radarMetric]);

  const filteredLexiconParties = useMemo(() => {
    const q = termQuery.trim().toLowerCase();
    return analytics.filter((item) => {
      const meta = getPartyMeta(item.partyId);
      if (scopeFilter === "congress" && meta.outgoingCongressSeats === null) return false;
      if (scopeFilter === "estatal" && meta.scope !== "estatal") return false;
      if (scopeFilter === "autonomico" && meta.scope !== "autonomico") return false;
      if (!q) return true;
      const termList = wordMode === "tfidf" ? item.distinctiveTerms : item.topFrequentTerms;
      return (
        item.shortName.toLowerCase().includes(q) ||
        item.partyName.toLowerCase().includes(q) ||
        termList.some((t) => t.term.toLowerCase().includes(q))
      );
    });
  }, [analytics, scopeFilter, termQuery, wordMode]);

  const sortedDnaParties = useMemo(() => {
    return [...analytics].sort((a, b) => {
      if (dnaSort === "proposals") return b.proposalCount - a.proposalCount;
      if (dnaSort === "specialization") {
        return b.topThreeConcentrationPct - a.topThreeConcentrationPct;
      }
      const aPct = a.macroAreas.find((m) => m.id === dnaSort)?.percentage ?? 0;
      const bPct = b.macroAreas.find((m) => m.id === dnaSort)?.percentage ?? 0;
      return bPct - aPct || b.proposalCount - a.proposalCount;
    });
  }, [analytics, dnaSort]);

  const sortedStyleParties = useMemo(() => {
    return [...analytics].sort((a, b) => {
      switch (styleMetric) {
        case "proposals":
          return b.proposalCount - a.proposalCount;
        case "density":
          return b.avgWordsPerProposal - a.avgWordsPerProposal;
        case "vocabulary":
          return b.uniqueTermCount - a.uniqueTermCount;
        case "words":
        default:
          return b.wordCount - a.wordCount;
      }
    });
  }, [analytics, styleMetric]);

  const maxStyleValue = useMemo(() => {
    if (sortedStyleParties.length === 0) return 1;
    return Math.max(
      1,
      ...sortedStyleParties.map((item) => {
        switch (styleMetric) {
          case "proposals":
            return item.proposalCount;
          case "density":
            return item.avgWordsPerProposal;
          case "vocabulary":
            return item.uniqueTermCount;
          case "words":
          default:
            return item.wordCount;
        }
      }),
    );
  }, [sortedStyleParties, styleMetric]);

  const switchMainTab = (next: MainTab) => {
    if (next === activeTab) return;
    runWithViewTransition(() => setActiveTab(next));
  };

  return (
    <div className="space-y-8">
      {/* Navegador principal por 3 lentes de análisis */}
      <div
        role="tablist"
        aria-label="Vistas de análisis estadístico y léxico"
        className="flex flex-wrap gap-2 border-y border-line py-4"
      >
        {[
          { id: "vocab" as const, label: "Vocabulario y radar de conceptos" },
          { id: "dna" as const, label: "ADN temático y prioridades" },
          { id: "style" as const, label: "Extensión, densidad y estilo" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchMainTab(tab.id)}
              className={`rounded-[3px] border px-4 py-2 text-xs font-bold transition-all duration-150 sm:text-sm ${
                active
                  ? "border-ink bg-ink text-canvas shadow-2xs"
                  : "border-line bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PESTAÑA 1: VOCABULARIO + RADAR DE CONCEPTOS */}
      {activeTab === "vocab" ? (
        <div key="tab-vocab" className="animate-panel-switch space-y-12">
          {/* Radar de conceptos */}
          {activeConcept ? (
            <section
              aria-labelledby="radar-conceptos-heading"
              className="rounded-[4px] border border-line bg-surface p-5 shadow-2xs sm:p-6"
            >
              <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                    Radar comparativo de términos
                  </p>
                  <h2
                    id="radar-conceptos-heading"
                    className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
                  >
                    ¿Quién habla más de cada concepto?
                  </h2>
                  <p className="text-sm text-ink-secondary">
                    Pulsa un término para ver qué candidaturas le dedican más peso proporcional o
                    más menciones en su programa.
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Métrica del radar"
                  className="inline-flex w-fit rounded-[3px] border border-line bg-canvas p-1"
                >
                  <button
                    type="button"
                    aria-pressed={radarMetric === "density"}
                    onClick={() => setRadarMetric("density")}
                    className={`rounded-[2px] px-2.5 py-1 text-xs font-bold transition-colors ${
                      radarMetric === "density"
                        ? "bg-ink text-canvas"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Por cada 100 medidas
                  </button>
                  <button
                    type="button"
                    aria-pressed={radarMetric === "mentions"}
                    onClick={() => setRadarMetric("mentions")}
                    className={`rounded-[2px] px-2.5 py-1 text-xs font-bold transition-colors ${
                      radarMetric === "mentions"
                        ? "bg-ink text-canvas"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Menciones totales
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {conceptRadar.map((concept) => {
                  const active = concept.id === activeConcept.id;
                  return (
                    <button
                      key={concept.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => runWithViewTransition(() => setSelectedConceptId(concept.id))}
                      className={`rounded-[3px] border px-3 py-1 text-xs font-semibold transition-all ${
                        active
                          ? "border-ink bg-ink font-bold text-canvas"
                          : "border-line bg-canvas text-ink-secondary hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {concept.label}{" "}
                      <span className="font-mono text-[11px] opacity-75">
                        ({concept.totalMentions})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                key={`${activeConcept.id}-${radarMetric}-${showAllRadarParties ? "all" : "top8"}`}
                className="animate-panel-switch mt-5 space-y-2.5 border-t border-line pt-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1 text-xs text-ink-muted">
                  <span>
                    Concepto: <strong className="text-ink">{activeConcept.label}</strong> ·{" "}
                    {activeConcept.totalMentions.toLocaleString("es-ES")} apariciones detectadas en
                    el corpus
                  </span>
                  <Link
                    href={`/buscar?q=${encodeURIComponent(activeConcept.query)}`}
                    className="link-draw font-bold text-civic"
                  >
                    Buscar «{activeConcept.query}» en los {analytics.length} programas →
                  </Link>
                </div>

                {sortedConceptParties.map((m, idx) => {
                  const visual = getPartyVisual(m.partyId);
                  const val = radarMetric === "mentions" ? m.mentions : m.per100Proposals;
                  const widthPct =
                    val === 0 ? 0 : Math.max(4, Math.round((val / maxConceptValue) * 100));

                  return (
                    <div
                      key={`${activeConcept.id}-${m.partyId}`}
                      className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-[minmax(6.5rem,9.5rem)_1fr_auto] sm:items-center sm:gap-3 sm:text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: visual.bg }}
                          />
                          <Link
                            href={`/buscar?partido=${encodeURIComponent(m.partyId)}&q=${encodeURIComponent(activeConcept.query)}`}
                            className="truncate font-bold text-ink hover:text-civic hover:underline"
                          >
                            {m.shortName}
                          </Link>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-bold text-ink sm:hidden">
                          {radarMetric === "mentions"
                            ? `${m.mentions} citas`
                            : `${m.per100Proposals} c/100`}
                        </span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-[2px] bg-surface-muted">
                        <div
                          data-visible="true"
                          className="bar-grow h-full rounded-[2px]"
                          style={
                            {
                              width: `${widthPct}%`,
                              backgroundColor: visual.bg,
                              "--bar-delay": `${idx * 25}ms`,
                            } as CSSProperties
                          }
                        />
                      </div>

                      <div className="hidden shrink-0 text-right font-mono text-xs text-ink-secondary sm:block">
                        <strong className="text-ink">
                          {radarMetric === "mentions"
                            ? `${m.mentions} citas`
                            : `${m.per100Proposals} c/100`}
                        </strong>
                        <span className="text-ink-muted">
                          {" "}
                          ·{" "}
                          {radarMetric === "mentions"
                            ? `${m.per100Proposals} c/100`
                            : `${m.mentions} menc.`}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {activeConcept.parties.length > 8 ? (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllRadarParties((prev) => !prev)}
                      className="rounded-[3px] border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink hover:border-ink"
                    >
                      {showAllRadarParties
                        ? "Mostrar solo los 8 primeros ↑"
                        : `Ver ranking completo de los ${activeConcept.parties.length} partidos ↓`}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Huella léxica por partido */}
          <section aria-labelledby="huella-lexica-heading" className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2
                  id="huella-lexica-heading"
                  className="text-2xl font-extrabold tracking-tight text-ink"
                >
                  Huella léxica de cada partido ({filteredLexiconParties.length})
                </h2>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {wordMode === "tfidf"
                    ? "Vocabulario que diferencia a cada formación frente al resto del corpus (TF-IDF)."
                    : "Términos más repetidos en términos absolutos dentro de cada programa."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Modo de palabras"
                  className="inline-flex rounded-[3px] border border-line bg-surface-muted p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={wordMode === "tfidf"}
                    onClick={() => runWithViewTransition(() => setWordMode("tfidf"))}
                    className={`rounded-[2px] px-2.5 py-1 text-xs font-bold transition-colors ${
                      wordMode === "tfidf"
                        ? "bg-surface text-ink shadow-2xs"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Palabras distintivas (TF-IDF)
                  </button>
                  <button
                    type="button"
                    aria-pressed={wordMode === "frequent"}
                    onClick={() => runWithViewTransition(() => setWordMode("frequent"))}
                    className={`rounded-[2px] px-2.5 py-1 text-xs font-bold transition-colors ${
                      wordMode === "frequent"
                        ? "bg-surface text-ink shadow-2xs"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    Más repetidas
                  </button>
                </div>

                <label htmlFor="lexicon-search-input" className="sr-only">
                  Filtrar partido o palabra
                </label>
                <input
                  id="lexicon-search-input"
                  type="search"
                  value={termQuery}
                  onChange={(e) => setTermQuery(e.target.value)}
                  placeholder="Buscar partido o palabra…"
                  className="w-48 rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por ámbito">
              {[
                { id: "all" as const, label: `Todos (${scopeCounts.all})` },
                { id: "congress" as const, label: `Congreso saliente (${scopeCounts.congress})` },
                { id: "estatal" as const, label: `Estatales (${scopeCounts.estatal})` },
                { id: "autonomico" as const, label: `Autonómicos (${scopeCounts.autonomico})` },
              ].map((tab) => {
                const active = scopeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setScopeFilter(tab.id)}
                    className={`rounded-[3px] border px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {filteredLexiconParties.length === 0 ? (
              <p className="rounded-[4px] border border-line bg-surface p-8 text-center text-sm text-ink-secondary">
                No hay candidaturas ni palabras destacadas que coincidan con «{termQuery}».
              </p>
            ) : (
              <div
                key={`${wordMode}-${scopeFilter}-${termQuery}`}
                className="animate-panel-switch grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                {filteredLexiconParties.map((item) => {
                  const visual = getPartyVisual(item.partyId);
                  const terms =
                    wordMode === "tfidf" ? item.distinctiveTerms : item.topFrequentTerms;
                  const topMacro = [...item.macroAreas].sort(
                    (a, b) => b.percentage - a.percentage,
                  )[0];

                  return (
                    <article
                      key={item.partyId}
                      style={{ borderLeftColor: visual.bg }}
                      className="editorial-card flex flex-col justify-between gap-4 rounded-[4px] border border-l-4 border-line bg-surface p-5 shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                              <Link
                                href={`/programas/${item.partyId}`}
                                className="link-draw hover:text-civic"
                              >
                                {item.shortName}
                              </Link>
                            </h3>
                            <p className="text-xs text-ink-muted">{item.partyName}</p>
                          </div>

                          <div className="text-right font-mono text-[11px] text-ink-muted">
                            <span className="font-bold text-ink">{item.proposalCount} medidas</span>{" "}
                            · ~{item.avgWordsPerProposal} pal./medida
                          </div>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 pt-1 leading-tight">
                          {terms.map((termObj, termIdx) => (
                            <Link
                              key={`${item.partyId}-${termObj.term}`}
                              href={`/buscar?partido=${encodeURIComponent(item.partyId)}&q=${encodeURIComponent(termObj.term)}`}
                              className={`${wordScaleClass(termIdx)} transition-colors hover:text-civic hover:underline`}
                              title={`${termObj.count} menciones en el programa de ${item.shortName}`}
                            >
                              {termObj.term}
                              <span className="ml-0.5 font-mono text-[10px] font-normal text-ink-muted">
                                ·{termObj.count}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-line pt-3">
                        <div
                          aria-hidden="true"
                          className="flex h-1.5 w-full overflow-hidden rounded-[2px] bg-surface-muted"
                        >
                          {item.macroAreas.map((area) => (
                            <div
                              key={`${item.partyId}-mini-${area.id}`}
                              style={{
                                width: `${area.percentage}%`,
                                backgroundColor: MACRO_AREA_COLORS[area.id].color,
                              }}
                              title={`${area.label}: ${area.percentage}%`}
                            />
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                          <span>
                            Peso principal:{" "}
                            <strong className="text-ink-secondary">
                              {topMacro
                                ? `${MACRO_AREA_COLORS[topMacro.id].shortLabel} (${topMacro.percentage}%)`
                                : "—"}
                            </strong>
                          </span>

                          <Link
                            href={`/programas/${item.partyId}`}
                            className="link-draw font-bold text-ink hover:text-civic"
                          >
                            Ver programa →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* PESTAÑA 2: ADN TEMÁTICO Y PRIORIDADES */}
      {activeTab === "dna" ? (
        <section
          key="tab-dna"
          aria-labelledby="adn-heading"
          className="animate-panel-switch space-y-6"
        >
          <div className="flex flex-col gap-4 rounded-[4px] border border-line bg-surface p-5 sm:p-6">
            <div className="space-y-1">
              <h2 id="adn-heading" className="text-2xl font-extrabold tracking-tight text-ink">
                Radiografía de prioridades: ¿en qué concentra sus propuestas cada partido?
              </h2>
              <p className="text-sm text-ink-secondary">
                Reparto porcentual de las medidas de cada candidatura entre 4 grandes áreas
                programáticas, sus 3 bloques principales y su grado de concentración temática.
              </p>
            </div>

            {/* Leyenda de las 4 grandes áreas */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-ink-secondary">
              {(Object.keys(MACRO_AREA_COLORS) as MacroAreaId[]).map((areaId) => (
                <span key={areaId} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: MACRO_AREA_COLORS[areaId].color }}
                  />
                  {MACRO_AREA_COLORS[areaId].shortLabel}
                </span>
              ))}
            </div>

            {/* Controles de ordenación */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
              <span className="mr-1 text-xs font-bold text-ink-muted">Ordenar por:</span>
              {[
                { id: "proposals" as const, label: "Total medidas" },
                { id: "bienestar" as const, label: "Más peso en Bienestar" },
                { id: "economia" as const, label: "Más peso en Economía" },
                { id: "instituciones" as const, label: "Más peso en Instituciones" },
                { id: "exterior" as const, label: "Más peso en Exterior/Defensa" },
                { id: "specialization" as const, label: "Mayor especialización (Top 3)" },
              ].map((opt) => {
                const active = dnaSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDnaSort(opt.id)}
                    className={`rounded-[3px] border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-canvas text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            key={`dna-${dnaSort}`}
            className="animate-panel-switch grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {sortedDnaParties.map((item) => {
              const visual = getPartyVisual(item.partyId);
              return (
                <article
                  key={`dna-card-${item.partyId}`}
                  style={{ borderLeftColor: visual.bg }}
                  className="editorial-card space-y-3.5 rounded-[4px] border border-l-4 border-line bg-surface p-5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-ink">
                        <Link
                          href={`/programas/${item.partyId}`}
                          className="link-draw hover:text-civic"
                        >
                          {item.shortName}
                        </Link>
                        <span className="ml-2 text-xs font-medium text-ink-muted">
                          {item.partyName}
                        </span>
                      </h3>
                    </div>

                    <span className="rounded-[3px] border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-bold text-ink-secondary">
                      Top 3 temas: {item.topThreeConcentrationPct}%
                    </span>
                  </div>

                  {/* Barra apilada de 4 macroáreas */}
                  <div className="space-y-1.5">
                    <div className="flex h-3.5 w-full overflow-hidden rounded-[3px] border border-line bg-surface-muted">
                      {item.macroAreas.map((area) => (
                        <div
                          key={`${item.partyId}-bar-${area.id}`}
                          style={{
                            width: `${area.percentage}%`,
                            backgroundColor: MACRO_AREA_COLORS[area.id].color,
                          }}
                          title={`${area.label}: ${area.count} medidas (${area.percentage}%)`}
                          className="h-full border-r border-canvas/40 last:border-r-0"
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-ink-secondary sm:grid-cols-4">
                      {item.macroAreas.map((area) => (
                        <div
                          key={`${item.partyId}-lbl-${area.id}`}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: MACRO_AREA_COLORS[area.id].color }}
                          />
                          <span className="truncate font-mono">
                            <strong className="text-ink">{area.percentage}%</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 bloques principales */}
                  <div className="space-y-1.5 border-t border-line pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Principales bloques del programa ({item.proposalCount} medidas en{" "}
                      {item.themeCount} temas)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.themeDistribution.slice(0, 3).map((th) => (
                        <Link
                          key={`${item.partyId}-th-${th.themeId}`}
                          href={`/programas/${item.partyId}#tema-${th.themeId}`}
                          className="rounded-[3px] border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-ink hover:text-ink"
                        >
                          {th.title}{" "}
                          <span className="font-mono text-ink-muted">({th.percentage}%)</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* PESTAÑA 3: EXTENSIÓN, DENSIDAD Y ESTILO */}
      {activeTab === "style" ? (
        <section
          key="tab-style"
          aria-labelledby="extension-heading"
          className="animate-panel-switch space-y-6"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h2
                id="extension-heading"
                className="text-2xl font-extrabold tracking-tight text-ink"
              >
                Extensión, tiempo de lectura y densidad por medida
              </h2>
              <p className="max-w-3xl text-sm text-ink-secondary">
                Compara el tamaño total de cada programa (~200 palabras por minuto) y su estilo de
                redacción: cuántas palabras dedica en promedio a explicar cada propuesta.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ordenar comparativa">
              {[
                { id: "words" as const, label: "Palabras totales" },
                { id: "proposals" as const, label: "Nº de medidas" },
                { id: "density" as const, label: "Palabras por medida" },
                { id: "vocabulary" as const, label: "Vocabulario único" },
              ].map((opt) => {
                const active = styleMetric === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStyleMetric(opt.id)}
                    className={`rounded-[3px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ScrollReveal>
            <div
              key={`style-${styleMetric}`}
              className="animate-panel-switch space-y-4 rounded-[4px] border border-line bg-surface p-5 shadow-2xs sm:p-6"
            >
              {sortedStyleParties.map((item, idx) => {
                const visual = getPartyVisual(item.partyId);
                const val =
                  styleMetric === "proposals"
                    ? item.proposalCount
                    : styleMetric === "density"
                      ? item.avgWordsPerProposal
                      : styleMetric === "vocabulary"
                        ? item.uniqueTermCount
                        : item.wordCount;
                const widthPct = Math.max(5, Math.round((val / maxStyleValue) * 100));

                return (
                  <div key={`len-${item.partyId}`} className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-[2px]"
                          style={{ backgroundColor: visual.bg }}
                        />
                        <Link
                          href={`/programas/${item.partyId}`}
                          className="link-draw font-bold text-ink hover:text-civic"
                        >
                          {item.shortName}
                        </Link>
                        <span className="hidden text-xs text-ink-muted sm:inline">
                          {item.partyName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-secondary">
                        <span className={styleMetric === "words" ? "font-bold text-ink" : ""}>
                          {item.wordCount.toLocaleString("es-ES")} pal. (~{item.readingLabel})
                        </span>
                        <span className={styleMetric === "proposals" ? "font-bold text-ink" : ""}>
                          {item.proposalCount} medidas
                        </span>
                        <span className={styleMetric === "density" ? "font-bold text-ink" : ""}>
                          ~{item.avgWordsPerProposal} pal./medida
                        </span>
                        <span className={styleMetric === "vocabulary" ? "font-bold text-ink" : ""}>
                          {item.uniqueTermCount.toLocaleString("es-ES")} términos únicos
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-[2px] bg-surface-muted">
                      <div
                        data-visible="true"
                        className="bar-grow h-full rounded-[2px]"
                        style={
                          {
                            width: `${widthPct}%`,
                            backgroundColor: visual.bg,
                            "--bar-delay": `${idx * 25}ms`,
                          } as CSSProperties
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </section>
      ) : null}
    </div>
  );
}
