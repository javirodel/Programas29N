"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PartyId, PartyPosition, SurveyQuestion, Theme } from "@/modules/corpus/types";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import { getPartyVisual } from "@/modules/ui/party-colors";

interface ThemeWithCount {
  theme: Theme;
  count: number;
}

interface HomeTopicSpotlightProps {
  themes: ThemeWithCount[];
  questions: SurveyQuestion[];
}

interface AxisPreset {
  id: string;
  label: string;
  description: string;
  primaryThemeId: string;
  questionIds: string[];
}

const AXES: AxisPreset[] = [
  {
    id: "economia-fiscalidad",
    label: "Economía e impuestos",
    description: "Fiscalidad sobre grandes patrimonios, jornada laboral y modelo tributario.",
    primaryThemeId: "fiscalidad",
    questionIds: ["q-fiscalidad-02", "q-empleo-03"],
  },
  {
    id: "vivienda-servicios",
    label: "Vivienda y servicios públicos",
    description: "Regulación del alquiler, gestión sanitaria pública y modelo educativo.",
    primaryThemeId: "vivienda",
    questionIds: ["q-vivienda-01", "q-sanidad-04"],
  },
  {
    id: "energia-campo",
    label: "Energía y mundo rural",
    description: "Continuidad de las centrales nucleares, Pacto Verde y sector agrario.",
    primaryThemeId: "energia",
    questionIds: ["q-energia-06", "q-rural-14"],
  },
  {
    id: "pensiones-familia",
    label: "Pensiones y familia",
    description:
      "Revalorización de pensiones con el IPC y ayudas directas por maternidad y crianza.",
    primaryThemeId: "pensiones-bienestar",
    questionIds: ["q-pensiones-07", "q-familia-15"],
  },
  {
    id: "inmigracion-seguridad",
    label: "Inmigración y seguridad",
    description: "Control fronterizo, regularizaciones, penas penales e inversión en defensa.",
    primaryThemeId: "inmigracion",
    questionIds: ["q-inmigracion-08", "q-justicia-11"],
  },
  {
    id: "territorial-instituciones",
    label: "Modelo territorial e instituciones",
    description: "Transferencias autonómicas, financiación singular y aforamientos políticos.",
    primaryThemeId: "territorial",
    questionIds: ["q-territorial-10", "q-regeneracion-12"],
  },
];

const FEATURED_PARTIES: Array<{ id: PartyId; shortName: string }> = [
  { id: "pp", shortName: "PP" },
  { id: "psoe", shortName: "PSOE" },
  { id: "vox", shortName: "Vox" },
  { id: "erc", shortName: "ERC" },
  { id: "pnv", shortName: "PNV" },
  { id: "bng", shortName: "BNG" },
  { id: "compromis", shortName: "Compromís" },
  { id: "pacma", shortName: "PACMA" },
];

type SpectrumBucket = "against" | "neutral" | "favor";

function classifyStance(pos: PartyPosition | undefined): {
  bucket: SpectrumBucket;
  badge: string | null;
} {
  if (!pos || pos.status === "sin_referencia") {
    return { bucket: "neutral", badge: "Sin ref." };
  }
  if (pos.status === "insuficiente") {
    return { bucket: "neutral", badge: "Ambiguo" };
  }
  switch (pos.value) {
    case 2:
      return { bucket: "favor", badge: "Muy a favor" };
    case 1:
      return { bucket: "favor", badge: "A favor" };
    case 0:
      return { bucket: "neutral", badge: "Neutro" };
    case -1:
      return { bucket: "against", badge: "En contra" };
    case -2:
      return { bucket: "against", badge: "Muy en contra" };
    default:
      return { bucket: "neutral", badge: "Sin ref." };
  }
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

export function HomeTopicSpotlight({ themes, questions }: HomeTopicSpotlightProps) {
  const [activeTab, setActiveTab] = useState<string>(AXES[0]?.id ?? "economia-fiscalidad");

  const questionMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const activeAxis = AXES.find((a) => a.id === activeTab) ?? null;
  const maxThemeCount = useMemo(() => Math.max(1, ...themes.map((item) => item.count)), [themes]);

  const axisQuestions = useMemo(() => {
    if (!activeAxis) return [];
    return activeAxis.questionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is SurveyQuestion => Boolean(q))
      .slice(0, 2);
  }, [activeAxis, questionMap]);

  const handleSelectTab = (nextId: string) => {
    if (nextId === activeTab) return;
    runWithViewTransition(() => setActiveTab(nextId));
  };

  return (
    <ScrollReveal
      as="section"
      id="temas"
      aria-labelledby="spotlight-heading"
      className="scroll-mt-24 space-y-6 border-t border-line pt-10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            El termómetro de los debates
          </p>
          <h2
            id="spotlight-heading"
            className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
          >
            ¿Dónde está cada partido a simple vista?
          </h2>
          <p className="max-w-2xl text-sm text-ink-secondary sm:text-base">
            Elige un eje para ver quién vota a favor, quién se opone y quién guarda silencio antes
            de bajar al texto literal.
          </p>
        </div>

        <Link href="/encuesta" className="link-draw shrink-0 text-sm font-bold text-civic">
          Responder test completo (5 min) →
        </Link>
      </div>

      {/* Carril de ejes + pestaña Todos los bloques */}
      <div role="tablist" aria-label="Seleccionar área temática" className="flex flex-wrap gap-2">
        {AXES.map((axis) => {
          const active = activeTab === axis.id;
          return (
            <button
              key={axis.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectTab(axis.id)}
              className={`rounded-[3px] border px-3.5 py-2 text-xs font-bold transition-all duration-150 sm:text-sm ${
                active
                  ? "border-ink bg-ink text-canvas"
                  : "border-line bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
              }`}
            >
              {axis.label}
            </button>
          );
        })}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all-blocks"}
          onClick={() => handleSelectTab("all-blocks")}
          className={`rounded-[3px] border px-3.5 py-2 text-xs font-bold transition-all duration-150 sm:text-sm ${
            activeTab === "all-blocks"
              ? "border-civic bg-civic text-white"
              : "border-line-strong bg-surface-muted text-ink hover:border-ink"
          }`}
        >
          Ver los {themes.length} bloques temáticos
        </button>
      </div>

      {/* Contenido animado según pestaña */}
      {activeTab === "all-blocks" ? (
        <ul
          key="all-blocks"
          className="animate-panel-switch grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {themes.map(({ theme, count }) => {
            const pct = Math.max(6, Math.round((count / maxThemeCount) * 100));
            return (
              <li key={theme.id}>
                <Link
                  href={`/comparar?bloque=${encodeURIComponent(theme.id)}`}
                  className="editorial-card group flex h-full flex-col justify-between gap-2.5 rounded-[3px] border border-line bg-surface p-4"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-ink group-hover:text-civic group-hover:underline">
                        {theme.title}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-ink-muted">
                        {count}
                      </span>
                    </div>
                    {theme.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                        {theme.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-[2px] bg-surface-muted">
                    <div
                      className="h-full bg-ink/70 transition-colors group-hover:bg-civic"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : activeAxis ? (
        <div key={activeAxis.id} className="animate-panel-switch space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-line bg-surface-muted px-4 py-3 text-xs sm:text-sm">
            <span className="text-ink-secondary">{activeAxis.description}</span>
            <Link
              href={`/comparar?bloque=${encodeURIComponent(activeAxis.primaryThemeId)}`}
              className="link-draw shrink-0 font-bold text-ink hover:text-civic"
            >
              Comparar medidas de este bloque →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {axisQuestions.map((question) => {
              const groups: Record<
                SpectrumBucket,
                Array<{ id: PartyId; shortName: string; badge: string | null }>
              > = {
                against: [],
                neutral: [],
                favor: [],
              };

              for (const party of FEATURED_PARTIES) {
                const classified = classifyStance(question.positions[party.id]);
                groups[classified.bucket].push({
                  id: party.id,
                  shortName: party.shortName,
                  badge: classified.badge,
                });
              }

              const spectrumCols: Array<{
                key: SpectrumBucket;
                title: string;
                borderTopClass: string;
              }> = [
                { key: "against", title: "En contra", borderTopClass: "border-t-rose-600" },
                {
                  key: "neutral",
                  title: "Neutro o sin referencia",
                  borderTopClass: "border-t-slate-400",
                },
                { key: "favor", title: "A favor", borderTopClass: "border-t-emerald-600" },
              ];

              return (
                <article
                  key={question.id}
                  className="flex flex-col justify-between gap-4 rounded-[4px] border border-line bg-surface p-5 shadow-2xs"
                >
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold leading-snug text-ink sm:text-lg">
                      {question.statement}
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {spectrumCols.map((col) => {
                        const list = groups[col.key];
                        return (
                          <div
                            key={col.key}
                            className={`rounded-[3px] border border-t-[3px] border-line ${col.borderTopClass} bg-canvas p-3`}
                          >
                            <div className="mb-2 flex items-baseline justify-between gap-1">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink">
                                {col.title}
                              </span>
                              <span className="font-mono text-[11px] text-ink-muted">
                                {list.length}
                              </span>
                            </div>

                            {list.length === 0 ? (
                              <p className="text-xs italic text-ink-muted">Ninguno</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {list.map((item) => {
                                  const visual = getPartyVisual(item.id);
                                  return (
                                    <Link
                                      key={item.id}
                                      href={`/comparar#cuestion-${question.id}`}
                                      title={`${item.shortName}: ${item.badge ?? col.title}`}
                                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-surface px-2 py-1 text-xs font-bold text-ink transition-colors hover:border-ink"
                                    >
                                      <span
                                        aria-hidden="true"
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: visual.bg }}
                                      />
                                      <span>{item.shortName}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                    <span className="text-ink-muted">
                      Pulsa un partido para leer su cita textual del PDF
                    </span>
                    <Link
                      href={`/comparar#cuestion-${question.id}`}
                      className="link-draw font-bold text-civic"
                    >
                      Comparar citas y páginas →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </ScrollReveal>
  );
}
