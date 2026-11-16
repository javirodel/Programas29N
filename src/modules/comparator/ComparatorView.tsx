"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildComparisonMatrix } from "@/modules/comparator/matrix";
import type {
  Party,
  PartyId,
  PartyPosition,
  PublicProposal,
  SurveyQuestion,
  Theme,
} from "@/modules/corpus/types";
import { EvidenceModal } from "@/modules/ui/components/EvidenceModal";
import { ProposalAnalysisDisclosure } from "@/modules/ui/components/ProposalAnalysisDisclosure";
import { ReadingProgressBar } from "@/modules/ui/components/ReadingProgressBar";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import { getPartyVisual } from "@/modules/ui/party-colors";

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

export interface PartyCompareStats {
  proposalCount: number;
  pageCount: number | null;
  pdfHref: string | null;
}

interface ComparatorViewProps {
  parties: Party[];
  themes: Theme[];
  proposals: PublicProposal[];
  questions: SurveyQuestion[];
  evidenceProposalsMap: Record<string, PublicProposal>;
  partyStatsMap: Record<string, PartyCompareStats>;
  initialPartyIds: PartyId[];
  initialThemeFilter: string;
  themeCountsByParty?: Record<string, Record<string, number>>;
  loadedBlockId?: string;
  loadedPartyIds?: PartyId[];
}

const MAX_PARTIES = 4;
const MIN_PARTIES = 2;
const INITIAL_VISIBLE_ROWS = 4;

const CCAA_PRESETS: Array<{ label: string; ids: string[] }> = [
  { label: "Toda España (PP · PSOE · Vox)", ids: ["pp", "psoe", "vox"] },
  { label: "Cataluña (PP · PSOE · Vox · ERC)", ids: ["pp", "psoe", "vox", "erc"] },
  { label: "Galicia (PP · PSOE · Vox · BNG)", ids: ["pp", "psoe", "vox", "bng"] },
  { label: "País Vasco (PP · PSOE · PNV · Vox)", ids: ["pp", "psoe", "pnv", "vox"] },
  { label: "C. Valenciana (PP · PSOE · Compromís · Vox)", ids: ["pp", "psoe", "compromis", "vox"] },
  {
    label: "Andalucía (PP · PSOE · Vox · Adelante)",
    ids: ["pp", "psoe", "vox", "adelante-andalucia"],
  },
  { label: "Canarias (PP · PSOE · CC · Vox)", ids: ["pp", "psoe", "coalicion-canaria", "vox"] },
  {
    label: "Teruel / Soria (PP · PSOE · Teruel Existe · Soria ¡YA!)",
    ids: ["pp", "psoe", "teruel-existe", "soria-ya"],
  },
];

function getStanceLabel(pos: PartyPosition | undefined): string {
  if (!pos || pos.status === "sin_referencia") return "No lo menciona";
  if (pos.status === "insuficiente") return "Postura ambigua";
  switch (pos.value) {
    case 2:
      return "Muy a favor";
    case 1:
      return "A favor";
    case 0:
      return "Postura neutra";
    case -1:
      return "En contra";
    case -2:
      return "Muy en contra";
    default:
      return "No lo menciona";
  }
}

export function ComparatorView({
  parties,
  themes,
  proposals,
  questions,
  evidenceProposalsMap,
  partyStatsMap,
  initialPartyIds,
  initialThemeFilter,
  themeCountsByParty,
  loadedBlockId,
  loadedPartyIds,
}: ComparatorViewProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<PartyId[]>(initialPartyIds);
  const [activeBlockId, setActiveBlockId] = useState<string>(initialThemeFilter);
  const [showPartySelector, setShowPartySelector] = useState<boolean>(false);
  const [onlyDifferences, setOnlyDifferences] = useState<boolean>(false);
  const [textFilter, setTextFilter] = useState<string>("");
  const [visibleRowCount, setVisibleRowCount] = useState<number>(INITIAL_VISIBLE_ROWS);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (questions[0]) initial[questions[0].id] = true;
    if (questions[1]) initial[questions[1].id] = true;
    return initial;
  });
  const [expandAllQuestions, setExpandAllQuestions] = useState<boolean>(false);
  const [expandedProposalIds, setExpandedProposalIds] = useState<Record<string, boolean>>({});
  const [activeEvidence, setActiveEvidence] = useState<PublicProposal | null>(null);
  const didMountRef = useRef(false);

  const toggleProposalExpanded = (id: string) => {
    setExpandedProposalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const partyMap = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties]);
  const themeMap = useMemo(() => new Map(themes.map((t) => [t.id, t])), [themes]);

  const selectedParties = useMemo(
    () => selectedIds.map((id) => partyMap.get(id)).filter((p): p is Party => Boolean(p)),
    [selectedIds, partyMap],
  );

  // Sincronizar URL al cambiar partidos o bloque activo
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (selectedIds.length > 0) {
      params.set("partidos", selectedIds.join(","));
    }
    if (activeBlockId !== "summary") {
      params.set("bloque", activeBlockId);
    }
    const qs = params.toString();
    router.replace(qs ? `/comparar?${qs}` : "/comparar", { scroll: false });
  }, [selectedIds, activeBlockId, router]);

  // Expandir cuestión automáticamente si llega con ancla #cuestion-...
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#cuestion-")) return;
      const qId = decodeURIComponent(hash.slice("#cuestion-".length));
      if (!qId) return;
      setExpandedQuestions((prev) => (prev[qId] ? prev : { ...prev, [qId]: true }));
    };
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  // Temas con al menos una propuesta entre las candidaturas seleccionadas
  const availableThemePills = useMemo(() => {
    const counts = new Map<string, number>();
    if (themeCountsByParty) {
      for (const partyId of selectedIds) {
        const byTheme = themeCountsByParty[partyId];
        if (!byTheme) continue;
        for (const [themeId, count] of Object.entries(byTheme)) {
          counts.set(themeId, (counts.get(themeId) ?? 0) + count);
        }
      }
    } else {
      const selectedSet = new Set(selectedIds);
      for (const p of proposals) {
        if (!selectedSet.has(p.party_id)) continue;
        counts.set(p.theme_id, (counts.get(p.theme_id) ?? 0) + 1);
      }
    }
    return [...themes]
      .filter((t) => t.is_canonical || (counts.get(t.id) ?? 0) > 0)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        theme: t,
        count: counts.get(t.id) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }, [themes, proposals, selectedIds, themeCountsByParty]);

  const filteredQuestions = useMemo(() => {
    const qLower = textFilter.trim().toLowerCase();
    return questions.filter((q) => {
      if (qLower && !q.statement.toLowerCase().includes(qLower)) {
        return false;
      }
      if (!onlyDifferences) return true;
      const sigs = new Set(
        selectedParties.map((party) => {
          const pos = q.positions[party.id];
          if (!pos) return "missing";
          return `${pos.status}:${String(pos.value)}`;
        }),
      );
      return sigs.size > 1;
    });
  }, [questions, textFilter, onlyDifferences, selectedParties]);

  const filteredProposals = useMemo(() => {
    const qLower = textFilter.trim().toLowerCase();
    if (!qLower) return proposals;
    return proposals.filter(
      (p) =>
        p.official_text.text.toLowerCase().includes(qLower) ||
        p.title.text.toLowerCase().includes(qLower),
    );
  }, [proposals, textFilter]);

  const blockMatrix = useMemo(() => {
    if (activeBlockId === "summary") return null;
    return buildComparisonMatrix({
      selectedPartyIds: selectedIds,
      parties,
      themes,
      proposals: filteredProposals,
      hideEmptyThemes: false,
      themeFilter: activeBlockId,
    });
  }, [activeBlockId, selectedIds, parties, themes, filteredProposals]);

  const togglePartySelection = (partyId: PartyId) => {
    runWithViewTransition(() => {
      setVisibleRowCount(INITIAL_VISIBLE_ROWS);
      setSelectedIds((prev) => {
        if (prev.includes(partyId)) {
          if (prev.length <= MIN_PARTIES) return prev;
          return prev.filter((id) => id !== partyId);
        }
        if (prev.length >= MAX_PARTIES) {
          return [...prev.slice(0, MAX_PARTIES - 1), partyId];
        }
        return [...prev, partyId];
      });
    });
  };

  const applyPreset = (ids: string[]) => {
    const valid = ids.filter((id): id is PartyId => partyMap.has(id as PartyId));
    if (valid.length >= MIN_PARTIES) {
      runWithViewTransition(() => {
        setVisibleRowCount(INITIAL_VISIBLE_ROWS);
        setSelectedIds(valid.slice(0, MAX_PARTIES));
        setShowPartySelector(false);
      });
    }
  };

  const selectBlock = (blockId: string) => {
    runWithViewTransition(() => {
      setActiveBlockId(blockId);
      setTextFilter("");
      setVisibleRowCount(INITIAL_VISIBLE_ROWS);
    });
  };

  const toggleQuestion = (questionId: string) => {
    runWithViewTransition(() => {
      setExpandedQuestions((prev) => ({
        ...prev,
        [questionId]: !(expandAllQuestions || Boolean(prev[questionId])),
      }));
    });
  };

  const isSummaryMode = activeBlockId === "summary";
  const activeTheme = !isSummaryMode ? themeMap.get(activeBlockId) : null;
  const activeTitle = activeTheme ? activeTheme.title : "15 debates clave";

  const columnGridClass =
    selectedParties.length === 2
      ? "grid-cols-1 md:grid-cols-2"
      : selectedParties.length === 3
        ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";

  const activeEvidencePartyName = activeEvidence
    ? (partyMap.get(activeEvidence.party_id)?.name.value ?? activeEvidence.party_id)
    : undefined;

  return (
    <div className="space-y-8 pb-6">
      {/* Cabecera editorial unificada con la portada */}
      <header className="space-y-4 border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-ink-secondary">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-civic" />
          <span>
            Comparador de programas · De {MIN_PARTIES} a {MAX_PARTIES} partidos frente a frente
          </span>
        </div>

        <h1 className="font-serif text-3xl font-black leading-[1.1] tracking-tight text-ink sm:text-4xl">
          Compara lo que promete cada partido, cara a cara.
        </h1>

        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary">
          Contrastado directamente sobre sus documentos oficiales en PDF: revisa primero las{" "}
          <strong className="font-semibold text-ink">15 cuestiones clave</strong> o baja a cada{" "}
          <strong className="font-semibold text-ink">bloque temático</strong> emparejado fila por
          fila.
        </p>
      </header>

      {/* Fila de partidos comparados (siempre visible y alineada) */}
      <section aria-labelledby="comparados-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="comparados-heading"
            className="text-xs font-bold uppercase tracking-wider text-ink-muted"
          >
            Candidaturas en pantalla ({selectedParties.length}/{MAX_PARTIES})
          </h2>

          <button
            type="button"
            aria-expanded={showPartySelector}
            onClick={() => runWithViewTransition(() => setShowPartySelector((prev) => !prev))}
            className="rounded-[3px] border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-bold text-ink transition-colors hover:border-ink"
          >
            {showPartySelector
              ? "Cerrar selector de partidos ↑"
              : "Cambiar partidos o elegir comunidad autónoma ↓"}
          </button>
        </div>

        <div className={`grid gap-3 ${columnGridClass}`}>
          {selectedParties.map((party) => {
            const visual = getPartyVisual(party.id);
            const short = party.short_name.value ?? party.id.toUpperCase();
            const fullName = party.name.value ?? short;
            const stats = partyStatsMap[party.id];

            return (
              <div
                key={`selected-card-${party.id}`}
                style={{ borderTopColor: visual.bg }}
                className="flex flex-col justify-between gap-2.5 rounded-[4px] border border-t-4 border-line bg-surface p-3.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink">
                      {short}
                    </h3>
                    <p className="truncate text-xs text-ink-secondary" title={fullName}>
                      {fullName}
                    </p>
                  </div>

                  {selectedParties.length > MIN_PARTIES ? (
                    <button
                      type="button"
                      aria-label={`Quitar a ${short} de la comparativa`}
                      onClick={() => togglePartySelection(party.id)}
                      className="rounded-[3px] border border-line px-1.5 py-0.5 text-xs font-bold text-ink-muted hover:border-ink hover:text-ink"
                    >
                      ×
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-[11px] text-ink-muted">
                  <span>
                    {stats?.proposalCount ?? 0} medidas
                    {stats?.pageCount ? ` · ${stats.pageCount} págs.` : ""}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/programas/${party.id}`}
                      className="link-draw font-bold text-ink hover:text-civic"
                    >
                      Programa →
                    </Link>
                    {stats?.pdfHref ? (
                      <a
                        href={stats.pdfHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-ink hover:underline"
                      >
                        PDF ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel desplegable de partidos y papeletas autonómicas */}
        {showPartySelector ? (
          <div className="animate-panel-switch space-y-4 rounded-[4px] border border-line-strong bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-ink">
                  Elige entre {MIN_PARTIES} y {MAX_PARTIES} candidaturas ({selectedIds.length}/
                  {MAX_PARTIES})
                </p>
                <p className="text-xs text-ink-muted">
                  O carga directamente las candidaturas de tu comunidad autónoma:
                </p>
              </div>

              <div>
                <label htmlFor="compare-ccaa-select" className="sr-only">
                  Papeleta por territorio
                </label>
                <select
                  id="compare-ccaa-select"
                  value=""
                  onChange={(e) => {
                    const preset = CCAA_PRESETS.find((p) => p.label === e.target.value);
                    if (preset) applyPreset(preset.ids);
                  }}
                  className="rounded-[3px] border border-line-strong bg-canvas px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <option value="" disabled>
                    Papeleta por comunidad…
                  </option>
                  {CCAA_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {parties.map((party) => {
                const isSelected = selectedIds.includes(party.id);
                const visual = getPartyVisual(party.id);
                const short = party.short_name.value ?? party.id.toUpperCase();

                return (
                  <button
                    key={party.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => togglePartySelection(party.id)}
                    style={{ borderTopColor: visual.bg }}
                    className={`rounded-[3px] border border-t-4 px-3 py-1.5 text-xs font-bold transition-colors ${
                      isSelected
                        ? "border-x-ink border-b-ink bg-ink text-canvas"
                        : "border-x-line border-b-line bg-canvas text-ink-secondary hover:border-x-line-strong hover:text-ink"
                    }`}
                  >
                    {isSelected ? `✓ ${short}` : short}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* Selector claro de 2 modos + controles contextuales */}
      <section aria-label="Modo de comparación" className="space-y-4">
        <div className="flex flex-col gap-3 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Elegir vista de comparación"
            className="flex w-full flex-wrap rounded-[4px] border border-line bg-surface-muted p-1 sm:inline-flex sm:w-fit"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isSummaryMode}
              onClick={() => selectBlock("summary")}
              className={`flex-1 rounded-[3px] px-3 py-1.5 text-center text-xs font-bold transition-all sm:flex-initial sm:px-3.5 sm:text-sm ${
                isSummaryMode
                  ? "bg-surface text-ink shadow-2xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              15 debates clave (Resumen)
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={!isSummaryMode}
              onClick={() => {
                if (isSummaryMode) {
                  selectBlock(availableThemePills[0]?.theme.id ?? "vivienda");
                }
              }}
              className={`flex-1 rounded-[3px] px-3 py-1.5 text-center text-xs font-bold transition-all sm:flex-initial sm:px-3.5 sm:text-sm ${
                !isSummaryMode
                  ? "bg-surface text-ink shadow-2xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Medidas por bloque temático
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isSummaryMode ? (
              <>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink">
                  <input
                    type="checkbox"
                    checked={onlyDifferences}
                    onChange={(e) => setOnlyDifferences(e.target.checked)}
                    className="h-3.5 w-3.5 accent-ink"
                  />
                  Solo donde discrepan
                </label>

                <button
                  type="button"
                  onClick={() =>
                    runWithViewTransition(() => setExpandAllQuestions((prev) => !prev))
                  }
                  className="rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink"
                >
                  {expandAllQuestions ? "Vista compacta" : "Desplegar todas las citas"}
                </button>
              </>
            ) : null}

            <label htmlFor="compare-search-filter" className="sr-only">
              Filtrar comparativa
            </label>
            <input
              id="compare-search-filter"
              type="search"
              value={textFilter}
              onChange={(e) => {
                setTextFilter(e.target.value);
                setVisibleRowCount(INITIAL_VISIBLE_ROWS);
              }}
              placeholder={
                isSummaryMode ? "Buscar cuestión…" : "Filtrar medidas dentro de este bloque…"
              }
              className="w-full rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted sm:w-56"
            />
          </div>
        </div>

        {/* Selector de bloque temático limpio (solo visible en modo bloque) */}
        {!isSummaryMode ? (
          <div className="animate-panel-switch space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Selecciona el bloque temático ({availableThemePills.length} disponibles):
            </p>
            <div role="tablist" aria-label="Bloque temático" className="flex flex-wrap gap-1.5">
              {availableThemePills.map(({ theme, count }) => {
                const active = activeBlockId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectBlock(theme.id)}
                    className={`rounded-[3px] border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {theme.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* CONTENIDO PRINCIPAL: MODO 1 (15 DEBATES CLAVE) O MODO 2 (CUADRÍCULA POR FILAS) */}
      {isSummaryMode ? (
        <div key="panel-summary" className="animate-panel-switch space-y-4">
          {filteredQuestions.length === 0 ? (
            <p className="rounded-[4px] border border-line bg-surface p-8 text-center text-sm text-ink-secondary">
              No hay cuestiones que coincidan con el filtro entre estas candidaturas.
            </p>
          ) : (
            filteredQuestions.map((question, qIdx) => {
              const qTheme = themeMap.get(question.theme_id);
              const isExpanded = expandAllQuestions || Boolean(expandedQuestions[question.id]);

              return (
                <ScrollReveal
                  as="div"
                  key={question.id}
                  delayMs={qIdx < 2 ? 0 : 30}
                  className="rounded-[4px] border border-line bg-surface p-4 shadow-2xs sm:p-5"
                >
                  <section
                    id={`cuestion-${question.id}`}
                    aria-labelledby={`heading-q-${question.id}`}
                    className="scroll-mt-32 space-y-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        {qTheme ? (
                          <button
                            type="button"
                            onClick={() => selectBlock(qTheme.id)}
                            className="text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-ink hover:underline"
                          >
                            {qTheme.title} ›
                          </button>
                        ) : null}
                        <h2
                          id={`heading-q-${question.id}`}
                          className="text-lg font-extrabold leading-snug tracking-tight text-ink sm:text-xl"
                        >
                          {question.statement}
                        </h2>
                      </div>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleQuestion(question.id)}
                        className="shrink-0 self-start rounded-[3px] border border-line-strong bg-canvas px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-ink"
                      >
                        {isExpanded ? "Ocultar citas ↑" : "Ver citas y páginas ↓"}
                      </button>
                    </div>

                    {/* Tira compacta de posturas */}
                    <div className={`grid gap-2.5 ${columnGridClass}`}>
                      {selectedParties.map((party) => {
                        const visual = getPartyVisual(party.id);
                        const short = party.short_name.value ?? party.id.toUpperCase();
                        const pos = question.positions[party.id];
                        const stanceLabel = getStanceLabel(pos);
                        const isSilent = !pos || pos.status !== "posicion";

                        return (
                          <div
                            key={`strip-${question.id}-${party.id}`}
                            style={{ borderTopColor: visual.bg }}
                            className={`flex items-center justify-between gap-2 rounded-[3px] border border-t-[3px] px-3 py-2 ${
                              isSilent
                                ? "border-x-line border-b-line bg-surface-muted/60 opacity-80"
                                : "border-x-line border-b-line bg-canvas"
                            }`}
                          >
                            <span className="text-xs font-extrabold uppercase tracking-wide text-ink">
                              {short}
                            </span>
                            <span className="text-xs font-semibold text-ink-secondary">
                              {stanceLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tarjetas alineadas al mismo alto cuando se despliegan */}
                    {isExpanded ? (
                      <div
                        key={`q-cards-${question.id}`}
                        className={`animate-panel-switch grid items-stretch gap-4 border-t border-line pt-4 ${columnGridClass}`}
                      >
                        {selectedParties.map((party) => {
                          const visual = getPartyVisual(party.id);
                          const short = party.short_name.value ?? party.id.toUpperCase();
                          const pos = question.positions[party.id];
                          const stanceLabel = getStanceLabel(pos);
                          const primaryProposalId = pos?.evidence_proposal_ids[0];
                          const primaryProposal = primaryProposalId
                            ? evidenceProposalsMap[primaryProposalId]
                            : undefined;
                          const ev = primaryProposal?.evidence[0];

                          return (
                            <article
                              key={`${question.id}-${party.id}`}
                              style={{ borderLeftColor: visual.bg }}
                              className="flex h-full flex-col justify-between gap-3 rounded-[3px] border border-l-4 border-line bg-canvas p-4"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink">
                                    {short}
                                  </h3>
                                  <span className="rounded-[3px] border border-line bg-surface px-2 py-0.5 text-[11px] font-bold text-ink">
                                    {stanceLabel}
                                  </span>
                                </div>

                                {primaryProposal?.title.text ? (
                                  <p
                                    className={`${
                                      expandedProposalIds[primaryProposal.id] ? "" : "line-clamp-2"
                                    } text-sm font-bold leading-snug text-ink`}
                                  >
                                    {primaryProposal.title.text}
                                  </p>
                                ) : null}

                                <p
                                  className={`${
                                    primaryProposal && expandedProposalIds[primaryProposal.id]
                                      ? "whitespace-pre-line"
                                      : "line-clamp-4"
                                  } font-serif text-sm leading-relaxed text-ink-secondary`}
                                >
                                  {primaryProposal
                                    ? `«${primaryProposal.official_text.text}»`
                                    : (pos?.rationale ??
                                      "No se pronuncia sobre esta cuestión en su programa.")}
                                </p>

                                {primaryProposal &&
                                primaryProposal.official_text.text.length > 170 ? (
                                  <button
                                    type="button"
                                    aria-expanded={Boolean(expandedProposalIds[primaryProposal.id])}
                                    onClick={() => toggleProposalExpanded(primaryProposal.id)}
                                    className="font-sans text-xs font-bold text-civic underline underline-offset-4 hover:text-ink"
                                  >
                                    {expandedProposalIds[primaryProposal.id]
                                      ? "Mostrar resumen"
                                      : "Leer completa"}
                                  </button>
                                ) : null}
                              </div>

                              <div className="mt-auto space-y-2 border-t border-line pt-2.5">
                                {ev ? (
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <a
                                      href={ev.pdf_href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block rounded-[3px] border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-secondary hover:border-ink hover:text-ink"
                                    >
                                      Pág. {ev.pages[0] ?? 1} ↗
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        primaryProposal && setActiveEvidence(primaryProposal)
                                      }
                                      className="text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                                    >
                                      Ver cita documental
                                    </button>
                                  </div>
                                ) : null}

                                {primaryProposal ? (
                                  <ProposalAnalysisDisclosure
                                    compact
                                    summary={primaryProposal.ai_annotations.summary}
                                    argumentsFor={primaryProposal.ai_annotations.arguments_for}
                                    argumentsAgainst={
                                      primaryProposal.ai_annotations.arguments_against
                                    }
                                    sourcesFor={primaryProposal.ai_annotations.sources_for}
                                    sourcesAgainst={primaryProposal.ai_annotations.sources_against}
                                  />
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                </ScrollReveal>
              );
            })
          )}
        </div>
      ) : (
        <div key={`${activeBlockId}::${textFilter}`} className="animate-panel-switch space-y-4">
          {(() => {
            const row = blockMatrix?.rows[0];
            const proposalsByParty = Object.fromEntries(
              selectedParties.map((p) => [p.id, row?.cells[p.id]?.proposals ?? []]),
            ) as Record<string, PublicProposal[]>;
            const maxColumnCount = Math.max(
              0,
              ...selectedParties.map((p) => proposalsByParty[p.id]?.length ?? 0),
            );
            const shownRows = Math.min(maxColumnCount, visibleRowCount);
            const totalInBlock = selectedParties.reduce(
              (sum, p) => sum + (proposalsByParty[p.id]?.length ?? 0),
              0,
            );

            return (
              <>
                {/* Cabecera sticky alineada con las columnas */}
                <div className="sticky top-[3.1rem] z-20 -mx-4 border-b border-line bg-canvas/95 px-4 pb-2 pt-1 backdrop-blur sm:top-[3.35rem] sm:-mx-6 sm:px-6 sm:pb-3 lg:-mx-8 lg:px-8">
                  <ReadingProgressBar />

                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1.5 pt-1.5 sm:pb-2.5 sm:pt-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-sm font-extrabold text-ink sm:text-lg">{activeTitle}</h2>
                      <span className="text-xs font-medium text-ink-muted">
                        ({totalInBlock} {totalInBlock === 1 ? "medida" : "medidas"} entre estas
                        candidaturas)
                      </span>
                    </div>
                  </div>

                  <div className={`hidden gap-4 md:grid ${columnGridClass}`}>
                    {selectedParties.map((party, colIdx) => {
                      const visual = getPartyVisual(party.id);
                      const short = party.short_name.value ?? party.id.toUpperCase();
                      const count = proposalsByParty[party.id]?.length ?? 0;
                      const barPct =
                        count === 0 || maxColumnCount === 0
                          ? 0
                          : Math.max(8, Math.round((count / maxColumnCount) * 100));

                      return (
                        <div
                          key={`col-head-${party.id}`}
                          style={{ borderTopColor: visual.bg }}
                          className="rounded-[3px] border border-t-4 border-line bg-surface px-3.5 py-2.5"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-extrabold text-ink">{short}</span>
                            <span className="font-mono text-xs font-semibold text-ink-muted">
                              {count} {count === 1 ? "medida" : "medidas"}
                            </span>
                          </div>
                          <div
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-surface-muted"
                          >
                            <div
                              data-visible="true"
                              className="bar-grow h-full rounded-[2px]"
                              style={
                                {
                                  width: `${barPct}%`,
                                  backgroundColor: visual.bg,
                                  "--bar-delay": `${colIdx * 60}ms`,
                                } as CSSProperties
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cuadrícula emparejada fila por fila (cero descolocación) */}
                {loadedBlockId !== undefined &&
                (activeBlockId !== loadedBlockId ||
                  (loadedPartyIds && selectedIds.some((id) => !loadedPartyIds.includes(id)))) ? (
                  <div className="space-y-4 rounded-[4px] border border-line bg-surface p-5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className="loading-bar-indeterminate h-full w-1/2 rounded-full bg-civic" />
                    </div>
                    <p className="text-center text-xs font-semibold text-ink-secondary">
                      Cargando medidas y citas de {activeTitle}…
                    </p>
                    <div className={`grid gap-4 ${columnGridClass}`}>
                      {selectedParties.map((party) => (
                        <div
                          key={`skel-${party.id}`}
                          className="space-y-3 rounded-[4px] border border-line bg-canvas p-4"
                        >
                          <div className="skeleton-shimmer h-4 w-20 rounded-[3px]" />
                          <div className="skeleton-shimmer h-5 w-4/5 rounded-[3px]" />
                          <div className="skeleton-shimmer h-3.5 w-full rounded-[3px]" />
                          <div className="skeleton-shimmer h-3.5 w-3/4 rounded-[3px]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : maxColumnCount === 0 ? (
                  <div className="rounded-[4px] border border-line bg-surface p-8 text-center text-sm text-ink-secondary">
                    Ninguno de los partidos seleccionados incluye propuestas en {activeTitle}
                    {textFilter.trim() ? ` que coincidan con «${textFilter.trim()}»` : ""}.
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {Array.from({ length: shownRows }).map((_, rowIdx) => (
                      <div
                        key={`${activeBlockId}-row-${rowIdx}`}
                        className={`grid items-stretch gap-4 ${columnGridClass}`}
                      >
                        {selectedParties.map((party) => {
                          const visual = getPartyVisual(party.id);
                          const short = party.short_name.value ?? party.id.toUpperCase();
                          const partyList = proposalsByParty[party.id] ?? [];
                          const proposal = partyList[rowIdx];

                          if (!proposal) {
                            return (
                              <div
                                key={`empty-${party.id}-${rowIdx}`}
                                className="flex h-full min-h-[11rem] flex-col items-center justify-center rounded-[4px] border border-dashed border-line bg-surface-muted/35 p-5 text-center text-xs text-ink-muted"
                              >
                                <p className="font-semibold text-ink-secondary">
                                  Sin más medidas de {short}
                                </p>
                                <p className="mt-1">
                                  ({partyList.length}{" "}
                                  {partyList.length === 1 ? "propuesta" : "propuestas"} en este
                                  bloque)
                                </p>
                              </div>
                            );
                          }

                          const ev = proposal.evidence[0];
                          const text = proposal.official_text.text;
                          const isExpanded = Boolean(expandedProposalIds[proposal.id]);
                          const isLongText = text.length > 170;

                          return (
                            <article
                              key={proposal.id}
                              style={{ borderTopColor: visual.bg }}
                              className="editorial-card flex h-full flex-col justify-between gap-3 rounded-[4px] border border-t-4 border-line bg-surface p-4 sm:p-5"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-extrabold text-white md:hidden"
                                      style={{ backgroundColor: visual.bg, color: visual.fg }}
                                    >
                                      {short}
                                    </span>
                                    <span className="font-mono font-bold text-ink-muted">
                                      <span className="hidden md:inline">{short} · </span>#
                                      {proposal.extraction_number}
                                    </span>
                                  </div>
                                  {ev ? (
                                    <a
                                      href={ev.pdf_href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-ink-muted hover:text-ink hover:underline"
                                    >
                                      Pág. {ev.pages[0] ?? 1} ↗
                                    </a>
                                  ) : null}
                                </div>

                                {isLongText ? (
                                  <button
                                    type="button"
                                    aria-expanded={isExpanded}
                                    onClick={() => {
                                      if (window.getSelection()?.toString()) return;
                                      toggleProposalExpanded(proposal.id);
                                    }}
                                    className="block w-full cursor-pointer space-y-2 text-left"
                                  >
                                    <h3
                                      className={`${
                                        isExpanded ? "" : "line-clamp-2"
                                      } text-base font-bold leading-snug text-ink`}
                                    >
                                      {proposal.title.text ||
                                        `Medida #${proposal.extraction_number}`}
                                    </h3>

                                    <p
                                      lang={proposal.official_text.language}
                                      className={`${
                                        isExpanded ? "whitespace-pre-line" : "line-clamp-4"
                                      } font-serif text-sm leading-relaxed text-ink-secondary`}
                                    >
                                      «{text}»
                                    </p>

                                    <span className="inline-block font-sans text-xs font-bold text-civic underline underline-offset-4 hover:text-ink">
                                      {isExpanded ? "Mostrar resumen" : "Leer medida completa"}
                                    </span>
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <h3 className="text-base font-bold leading-snug text-ink">
                                      {proposal.title.text ||
                                        `Medida #${proposal.extraction_number}`}
                                    </h3>

                                    <p
                                      lang={proposal.official_text.language}
                                      className="font-serif text-sm leading-relaxed text-ink-secondary"
                                    >
                                      «{text}»
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-auto space-y-2.5 border-t border-line pt-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setActiveEvidence(proposal)}
                                    className="font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                                  >
                                    Ver cita documental
                                  </button>
                                  <Link
                                    href={`/programas/${party.id}#medida-${proposal.id}`}
                                    className="font-medium text-ink-muted hover:text-ink hover:underline"
                                  >
                                    Abrir en programa →
                                  </Link>
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
                      </div>
                    ))}

                    {/* Paginación progresiva de filas */}
                    {maxColumnCount > shownRows || visibleRowCount > INITIAL_VISIBLE_ROWS ? (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        {maxColumnCount > shownRows ? (
                          <button
                            type="button"
                            onClick={() => setVisibleRowCount((prev) => prev + 4)}
                            className="rounded-[3px] border border-ink bg-ink px-4 py-2 text-xs font-bold text-canvas transition-colors hover:bg-civic"
                          >
                            + Mostrar 4 filas más ({maxColumnCount - shownRows} restantes)
                          </button>
                        ) : null}
                        {visibleRowCount > INITIAL_VISIBLE_ROWS ? (
                          <button
                            type="button"
                            onClick={() => setVisibleRowCount(INITIAL_VISIBLE_ROWS)}
                            className="rounded-[3px] border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-ink"
                          >
                            Contraer a {INITIAL_VISIBLE_ROWS} filas ↑
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <EvidenceModal
        proposal={activeEvidence}
        partyName={activeEvidencePartyName}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
