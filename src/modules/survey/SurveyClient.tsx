"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import type {
  LikertScore,
  Party,
  PublicProposal,
  SurveyQuestion,
  Theme,
} from "@/modules/corpus/types";
import { Badge } from "@/modules/ui/components/Badge";
import { EvidenceModal } from "@/modules/ui/components/EvidenceModal";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import { getPartyMeta, getPartyVisual } from "@/modules/ui/party-colors";
import { calculateSurveyAffinity, type UserAnswersMap, type UserAnswerValue } from "./calculator";

const STORAGE_KEY = "29n_survey_state_v1";

interface SurveyClientProps {
  questions: SurveyQuestion[];
  parties: Party[];
  themes: Theme[];
  evidenceProposalsMap: Record<string, PublicProposal>;
}

type ViewStep = "intro" | "question" | "results";

const LIKERT_OPTIONS: Array<{
  value: UserAnswerValue;
  tag: string;
  label: string;
  hint: string;
}> = [
  {
    value: 2,
    tag: "+2",
    label: "Totalmente de acuerdo",
    hint: "Respaldo pleno a la medida",
  },
  {
    value: 1,
    tag: "+1",
    label: "De acuerdo",
    hint: "Inclinación favorable con matices",
  },
  {
    value: 0,
    tag: "0",
    label: "Neutral / Indiferente",
    hint: "Posición equilibrada o mixta",
  },
  {
    value: -1,
    tag: "-1",
    label: "En desacuerdo",
    hint: "Inclinación contraria con matices",
  },
  {
    value: -2,
    tag: "-2",
    label: "Totalmente en desacuerdo",
    hint: "Rechazo pleno a la medida",
  },
  {
    value: "skip",
    tag: "—",
    label: "Prefiero no responder",
    hint: "Esta pregunta no contará en el cálculo",
  },
];

function formatScoreLabel(val: UserAnswerValue | undefined | null): string {
  switch (val) {
    case 2:
      return "Totalmente de acuerdo (+2)";
    case 1:
      return "De acuerdo (+1)";
    case 0:
      return "Neutral (0)";
    case -1:
      return "En desacuerdo (-1)";
    case -2:
      return "Totalmente en desacuerdo (-2)";
    case "skip":
      return "No respondida";
    default:
      return "Sin respuesta";
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

const emptySubscribe = () => () => {};

export function SurveyClient({
  questions,
  parties,
  themes,
  evidenceProposalsMap,
}: SurveyClientProps) {
  const [step, setStep] = useState<ViewStep>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswersMap>({});
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<PublicProposal | null>(null);
  const cardTopRef = useRef<HTMLDivElement | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSurveyTop = () => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      cardTopRef.current?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  const themeTitleMap = useMemo(() => new Map(themes.map((t) => [t.id, t.title])), [themes]);
  const partyNameMap = useMemo(
    () => new Map(parties.map((p) => [p.id, p.name.value ?? p.id])),
    [parties],
  );

  const savedDraftRaw = useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        return window.sessionStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );

  useEffect(() => {
    if (step === "intro" && Object.keys(answers).length === 0) {
      return;
    }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, currentIndex, answers }));
    } catch {
      // Silencio seguro en navegación privada estricta
    }
  }, [step, currentIndex, answers]);

  const restoreSavedDraft = () => {
    if (!savedDraftRaw) return;
    try {
      const parsed = JSON.parse(savedDraftRaw) as {
        step?: ViewStep;
        currentIndex?: number;
        answers?: UserAnswersMap;
      };
      runWithViewTransition(() => {
        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (typeof parsed.currentIndex === "number" && parsed.currentIndex >= 0) {
          setCurrentIndex(Math.min(parsed.currentIndex, Math.max(0, questions.length - 1)));
        }
        setStep(parsed.step === "results" ? "results" : "question");
      });
    } catch {
      // Ignorar borrador corrupto
    }
  };

  const calculation = useMemo(
    () =>
      calculateSurveyAffinity({
        questions,
        parties,
        themes,
        answers,
      }),
    [questions, parties, themes, answers],
  );

  const [scopeFilter, setScopeFilter] = useState<"all" | "estatal">("all");
  const [summaryCopied, setSummaryCopied] = useState(false);

  const visibleResults = useMemo(() => {
    if (scopeFilter === "all") return calculation.results;
    return calculation.results.filter((r) => getPartyMeta(r.partyId).scope === "estatal");
  }, [calculation.results, scopeFilter]);

  const estatalCount = useMemo(
    () => calculation.results.filter((r) => getPartyMeta(r.partyId).scope === "estatal").length,
    [calculation.results],
  );

  const top3CompareIds = useMemo(
    () => visibleResults.slice(0, 3).map((r) => r.partyId),
    [visibleResults],
  );

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const goNext = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    runWithViewTransition(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setStep("results");
      }
    });
    scrollToSurveyTop();
  };

  const selectOption = (value: UserAnswerValue) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }
    autoAdvanceRef.current = setTimeout(() => {
      goNext();
    }, 180);
  };

  const goPrev = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    runWithViewTransition(() => {
      if (currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      } else {
        setStep("intro");
      }
    });
    scrollToSurveyTop();
  };

  const resetSurvey = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    runWithViewTransition(() => {
      setAnswers({});
      setCurrentIndex(0);
      setExpandedPartyId(null);
      setStep("intro");
    });
    scrollToSurveyTop();
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  };

  if (questions.length === 0) {
    return (
      <p className="rounded-[3px] border border-line bg-surface p-6 text-sm text-ink-secondary">
        Todavía no hay preguntas publicadas en el test de afinidad.
      </p>
    );
  }

  if (step === "intro") {
    const hasProgress = Object.keys(answers).length > 0;
    return (
      <section ref={cardTopRef} className="animate-panel-switch scroll-mt-20 space-y-8 py-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            ¿Qué programa del 29N encaja más contigo?
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-ink-secondary">
            Valora {questions.length} afirmaciones sobre vivienda, impuestos, empleo, sanidad,
            educación, energía, pensiones y modelo territorial. Tus respuestas se calculan
            íntegramente en tu navegador sin enviar datos fuera y sin penalizar los temas que un
            partido no aborda.
          </p>
          <p className="text-xs font-medium text-ink-muted">
            Duración aproximada: 5 minutos · Resultados ordenados con cita exacta al PDF oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              runWithViewTransition(() => setStep("question"));
              scrollToSurveyTop();
            }}
            className="rounded-[3px] border-2 border-ink bg-ink px-6 py-2.5 text-sm font-bold text-canvas transition-all duration-200 hover:-translate-y-0.5 hover:bg-transparent hover:text-ink"
          >
            {hasProgress ? "Continuar test" : "Empezar test →"}
          </button>

          {!hasProgress && savedDraftRaw ? (
            <button
              type="button"
              onClick={() => {
                restoreSavedDraft();
                scrollToSurveyTop();
              }}
              className="rounded-[3px] border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink"
            >
              Recuperar respuestas guardadas
            </button>
          ) : null}

          {hasProgress ? (
            <>
              <button
                type="button"
                onClick={() => {
                  runWithViewTransition(() => setStep("results"));
                  scrollToSurveyTop();
                }}
                className="rounded-[3px] border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink"
              >
                Ver resultados ({calculation.answeredCount})
              </button>
              <button
                type="button"
                onClick={resetSurvey}
                className="px-3 py-2 text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                Reiniciar
              </button>
            </>
          ) : null}

          <Link
            href="/metodologia#afinidad"
            className="link-draw ml-auto text-xs font-semibold text-ink-muted hover:text-ink"
          >
            Cómo se calcula la afinidad →
          </Link>
        </div>
      </section>
    );
  }

  if (step === "question" && currentQuestion) {
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
    const themeTitle = themeTitleMap.get(currentQuestion.theme_id) ?? currentQuestion.theme_id;

    return (
      <section
        ref={cardTopRef}
        className="fade-lift-in scroll-mt-20 space-y-6 rounded-[4px] border border-line bg-surface p-5 sm:p-7"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
            <span>
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
            <span className="text-ink">{themeTitle}</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de la encuesta"
            className="h-1.5 w-full overflow-hidden rounded-[2px] bg-surface-muted"
          >
            <div
              className="h-full bg-ink transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Pasos rápidos 1..15 */}
          <nav aria-label="Saltar a pregunta" className="flex flex-wrap gap-1 pt-0.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    if (autoAdvanceRef.current) {
                      clearTimeout(autoAdvanceRef.current);
                      autoAdvanceRef.current = null;
                    }
                    runWithViewTransition(() => setCurrentIndex(idx));
                    scrollToSurveyTop();
                  }}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Pregunta ${idx + 1}${isAnswered ? " (respondida)" : ""}`}
                  className={`h-6 min-w-6 rounded-[3px] border px-1.5 font-mono text-[11px] font-bold transition-colors ${
                    isCurrent
                      ? "border-ink bg-ink text-canvas"
                      : isAnswered
                        ? "border-civic/60 bg-civic-subtle text-ink"
                        : "border-line bg-canvas text-ink-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </nav>
        </div>

        <fieldset key={currentQuestion.id} className="animate-panel-switch space-y-4">
          <legend className="text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-2xl">
            {currentQuestion.statement}
          </legend>
          {currentQuestion.context_note ? (
            <p className="text-sm leading-relaxed text-ink-secondary">
              {currentQuestion.context_note}
            </p>
          ) : null}

          <div
            className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2"
            role="radiogroup"
            aria-label={currentQuestion.statement}
          >
            {LIKERT_OPTIONS.map((opt) => {
              const checked = currentAnswer === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => selectOption(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-[3px] border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    checked
                      ? "border-ink bg-ink text-canvas shadow-xs"
                      : "border-line bg-canvas text-ink hover:border-line-strong"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] font-mono text-xs font-bold ${
                      checked
                        ? "bg-canvas text-ink"
                        : "border border-line bg-surface text-ink-secondary"
                    }`}
                  >
                    {opt.tag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-tight">{opt.label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-snug ${checked ? "opacity-80" : "text-ink-muted"}`}
                    >
                      {opt.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-[3px] border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-ink"
          >
            ← Anterior
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {calculation.answeredCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  runWithViewTransition(() => setStep("results"));
                  scrollToSurveyTop();
                }}
                className="text-xs font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                Saltar a resultados
              </button>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              className="rounded-[3px] border border-ink bg-ink px-5 py-2 text-xs font-bold text-canvas transition-colors hover:bg-transparent hover:text-ink"
            >
              {currentIndex + 1 < questions.length ? "Siguiente →" : "Ver afinidad →"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleCopySummary = async () => {
    if (typeof window === "undefined" || visibleResults.length === 0) return;
    const lines = [
      `Mi afinidad 29N (${calculation.answeredCount}/${calculation.totalQuestions} preguntas respondidas):`,
      ...visibleResults
        .slice(0, 6)
        .map(
          (r, i) =>
            `${i + 1}. ${r.shortName} (${r.partyName}): ${r.affinityPercent ?? "N/D"}% (cobertura ${r.coveragePercent}%)`,
        ),
      "",
      `Consulta tus programas: ${window.location.origin}/encuesta`,
    ];
    try {
      await navigator.clipboard?.writeText(lines.join("\n"));
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2500);
    } catch {
      // Silencio si el navegador restringe el portapapeles
    }
  };

  return (
    <div ref={cardTopRef} className="animate-panel-switch scroll-mt-20 space-y-6">
      <div className="space-y-4 border-b border-line pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Tu afinidad con cada partido</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Basado en{" "}
              <strong>
                {calculation.answeredCount} de {calculation.totalQuestions} preguntas respondidas
              </strong>
              {calculation.skippedCount > 0 ? ` (${calculation.skippedCount} omitidas)` : ""}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {calculation.answeredCount > 0 ? (
              <button
                type="button"
                onClick={handleCopySummary}
                className="rounded-[3px] border border-line-strong bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:border-ink"
              >
                {summaryCopied ? "Resumen copiado ✓" : "Copiar resumen"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => runWithViewTransition(() => setStep("question"))}
              className="rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
            >
              Revisar respuestas
            </button>
            <button
              type="button"
              onClick={resetSurvey}
              className="px-2 py-1.5 text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              Repetir test
            </button>
          </div>
        </div>

        {calculation.answeredCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filtrar resultados por ámbito"
            >
              <button
                type="button"
                aria-pressed={scopeFilter === "all"}
                onClick={() => setScopeFilter("all")}
                className={`rounded-[3px] border px-3 py-1 text-xs font-semibold transition-colors ${
                  scopeFilter === "all"
                    ? "border-ink bg-ink text-canvas font-bold"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong"
                }`}
              >
                Todas las candidaturas ({calculation.results.length})
              </button>
              <button
                type="button"
                aria-pressed={scopeFilter === "estatal"}
                onClick={() => setScopeFilter("estatal")}
                className={`rounded-[3px] border px-3 py-1 text-xs font-semibold transition-colors ${
                  scopeFilter === "estatal"
                    ? "border-ink bg-ink text-canvas font-bold"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong"
                }`}
              >
                Solo ámbito estatal ({estatalCount})
              </button>
            </div>

            {top3CompareIds.length >= 2 ? (
              <Link
                href={`/comparar?partidos=${encodeURIComponent(top3CompareIds.join(","))}`}
                className="link-draw text-xs font-bold text-civic"
              >
                Comparar mis 3 partidos más afines →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {calculation.answeredCount === 0 ? (
        <p className="rounded-[3px] border border-line bg-surface py-8 text-center text-sm text-ink-secondary">
          No has respondido con postura numérica a ninguna pregunta todavía. Pulsa en «Revisar
          respuestas» para valorar al menos una afirmación.
        </p>
      ) : (
        <div className="space-y-4">
          {visibleResults.map((res, rankIdx) => {
            const isExpanded = expandedPartyId === res.partyId;
            const visual = getPartyVisual(res.partyId);
            return (
              <ScrollReveal
                as="article"
                key={res.partyId}
                delayMs={Math.min(rankIdx * 45, 360)}
                style={{ borderLeftColor: visual.bg }}
                className="editorial-card space-y-4 border border-l-4 border-line bg-surface p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink-muted">
                        #{rankIdx + 1}
                      </span>
                      <h3 className="text-lg font-extrabold text-ink">{res.shortName}</h3>
                      <span className="text-sm text-ink-secondary">{res.partyName}</span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      Cobertura:{" "}
                      <strong className="text-ink-secondary">
                        {res.comparableQuestionsCount} de {res.answeredQuestionsCount} preguntas
                      </strong>{" "}
                      ({res.coveragePercent}% · {res.insufficientOrMissingCount} sin referencia o
                      insuficientes).
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-ink">
                        {res.affinityPercent !== null ? `${res.affinityPercent}%` : "N/D"}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                        afinidad
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedPartyId(isExpanded ? null : res.partyId)}
                      className="rounded-[3px] border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
                    >
                      {isExpanded ? "Ocultar detalle" : "Ver por pregunta"}
                    </button>
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="h-2.5 w-full overflow-hidden rounded-[2px] bg-surface-muted"
                >
                  <div
                    className="bar-grow h-full rounded-[2px]"
                    style={
                      {
                        width: `${res.affinityPercent ?? 0}%`,
                        backgroundColor: visual.bg,
                        "--bar-delay": `${Math.min(rankIdx * 60, 420)}ms`,
                      } as CSSProperties
                    }
                  />
                </div>

                {isExpanded ? (
                  <div className="animate-panel-switch space-y-4 border-t border-line pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-ink">
                        Desglose documental pregunta por pregunta
                      </span>
                      <Link
                        href={`/programas/${res.partyId}`}
                        className="font-bold text-ink underline underline-offset-4 hover:text-civic"
                      >
                        Ver programa completo de {res.shortName} →
                      </Link>
                    </div>

                    <div className="divide-y divide-line">
                      {res.comparisons.map((comp) => (
                        <div key={comp.questionId} className="space-y-2 py-3.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold uppercase tracking-wider text-ink-muted">
                              {comp.themeTitle}
                            </span>
                            {comp.comparable && comp.agreementPercent !== null ? (
                              <Badge variant="verified">
                                Coincidencia: {comp.agreementPercent}%
                              </Badge>
                            ) : (
                              <Badge variant="neutral">
                                {comp.partyStatus === "insuficiente"
                                  ? "Dato insuficiente"
                                  : comp.partyStatus === "sin_referencia"
                                    ? "Sin referencia"
                                    : "Pregunta omitida"}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm font-bold text-ink">{comp.statement}</p>

                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                            <span>
                              <span className="text-ink-muted">Tu respuesta: </span>
                              <strong className="text-ink">
                                {formatScoreLabel(comp.userValue)}
                              </strong>
                            </span>
                            <span>
                              <span className="text-ink-muted">Posición {res.shortName}: </span>
                              <strong className="text-ink">
                                {comp.partyStatus === "posicion"
                                  ? formatScoreLabel(comp.partyValue as LikertScore)
                                  : comp.partyStatus === "insuficiente"
                                    ? "Información insuficiente"
                                    : "Sin referencia"}
                              </strong>
                            </span>
                          </div>

                          <p className="font-serif text-sm text-ink-secondary">{comp.rationale}</p>

                          {comp.evidenceProposalIds.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-ink-muted">Cita:</span>
                              {comp.evidenceProposalIds.map((pid) => {
                                const prop = evidenceProposalsMap[pid];
                                if (!prop) return null;
                                const pNum = prop.evidence[0]?.pages[0];
                                return (
                                  <button
                                    key={pid}
                                    type="button"
                                    onClick={() => setActiveEvidence(prop)}
                                    className="rounded-[3px] border border-line px-2 py-0.5 font-mono text-[11px] font-semibold text-ink hover:border-ink"
                                  >
                                    {prop.legacy_id} {pNum ? `pág. ${pNum}` : ""}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {calculation.answeredCount > 0 ? (
        <p className="text-xs text-ink-muted">
          Resultado orientativo basado en las propuestas escritas de cada programa.{" "}
          <Link href="/metodologia" className="text-civic hover:underline">
            Ver cómo se calcula →
          </Link>
        </p>
      ) : null}

      <EvidenceModal
        proposal={activeEvidence}
        partyName={activeEvidence ? partyNameMap.get(activeEvidence.party_id) : undefined}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
