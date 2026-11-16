"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const ROTATING_TOPICS = [
  "alquiler y vivienda",
  "IRPF y grandes fortunas",
  "listas de espera en sanidad",
  "pensiones e IPC",
  "energía nuclear y renovables",
  "reducción de jornada",
];

const QUICK_PILLS = ["vivienda", "impuestos", "sanidad", "pensiones", "energía", "empleo"];

interface HeroQuestionSearchProps {
  totalPrograms?: number;
  pendingCongressCount?: number;
}

export function HeroQuestionSearch({
  totalPrograms = 20,
  pendingCongressCount = 3,
}: HeroQuestionSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [topicIndex, setTopicIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTopicIndex((prev) => (prev + 1) % ROTATING_TOPICS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) {
      router.push("/buscar");
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(cleaned)}`);
  };

  const showAnimatedSuggestion = query.length === 0 && !focused;

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Buscar propuestas por palabra clave"
        className="rounded-[4px] border-2 border-ink bg-surface p-1.5 shadow-xs transition-shadow focus-within:ring-2 focus-within:ring-civic/30"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="pl-2.5 text-ink-muted">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx="8.5" cy="8.5" r="5.75" />
              <path d="m13 13 4.25 4.25" strokeLinecap="round" />
            </svg>
          </span>

          <div className="relative flex-1 overflow-hidden">
            <label htmlFor="hero-topic-search" className="sr-only">
              Busca una medida o palabra clave en los programas del 29N
            </label>
            {showAnimatedSuggestion ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-1 flex items-center text-sm text-ink-muted/75 sm:text-base"
              >
                <span className="mr-1 hidden sm:inline">Prueba con</span>
                <span key={topicIndex} className="slot-word-in font-medium text-ink-muted">
                  «{ROTATING_TOPICS[topicIndex]}»
                </span>
              </span>
            ) : null}
            <input
              id="hero-topic-search"
              type="search"
              name="q"
              value={query}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={focused ? "Ej.: alquiler, nuclear, IRPF, becas…" : ""}
              className="relative z-10 w-full bg-transparent px-1 py-2 text-sm font-medium text-ink placeholder:text-ink-muted/60 focus:outline-none sm:text-base"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-[3px] bg-ink px-4 py-2 text-xs font-bold text-canvas transition-colors hover:bg-civic sm:text-sm"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
        <span className="mr-0.5 font-medium">Búsquedas rápidas:</span>
        {QUICK_PILLS.map((term) => (
          <Link
            key={term}
            href={`/buscar?q=${encodeURIComponent(term)}`}
            className="rounded-[3px] border border-line bg-surface px-2.5 py-1 font-semibold text-ink-secondary transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:text-ink"
          >
            {term}
          </Link>
        ))}
      </div>

      {/* 3 accesos directos editoriales */}
      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
        <Link
          href="/comparar"
          className="editorial-card group rounded-[4px] border border-line bg-surface p-3.5"
        >
          <p className="text-sm font-extrabold text-ink group-hover:text-civic">
            Comparador cara a cara →
          </p>
          <p className="mt-1 text-xs leading-snug text-ink-secondary">
            Cruza de 2 a 4 partidos en 15 debates o por bloque
          </p>
        </Link>

        <Link
          href="/encuesta"
          className="editorial-card group rounded-[4px] border border-line bg-surface p-3.5"
        >
          <p className="text-sm font-extrabold text-ink group-hover:text-civic">
            Test de afinidad (5 min) →
          </p>
          <p className="mt-1 text-xs leading-snug text-ink-secondary">
            15 preguntas clave · Cálculo 100 % en tu navegador
          </p>
        </Link>

        <Link
          href="/programas"
          className="editorial-card group rounded-[4px] border border-line bg-surface p-3.5"
        >
          <p className="text-sm font-extrabold text-ink group-hover:text-civic">
            Catálogo de programas →
          </p>
          <p className="mt-1 text-xs leading-snug text-ink-secondary">
            {totalPrograms} PDFs oficiales auditados y {pendingCongressCount} en seguimiento
          </p>
        </Link>
      </div>
    </div>
  );
}
