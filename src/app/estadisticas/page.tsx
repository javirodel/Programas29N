import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllPartyAnalytics,
  getConceptRadar,
  loadCoverageReport,
} from "@/modules/corpus/repository";
import { VocabularyStatsExplorer } from "@/modules/stats/VocabularyStatsExplorer";

export const metadata: Metadata = {
  title: "Vocabulario y Radiografía Estadística | 29N",
  description:
    "Radar interactivo de conceptos, palabras características (TF-IDF), prioridades temáticas y análisis de extensión y estilo de los 26 programas del 29N.",
};

export default async function EstadisticasPage() {
  const [analytics, conceptRadar, coverage] = await Promise.all([
    getAllPartyAnalytics(),
    getConceptRadar(),
    loadCoverageReport(),
  ]);

  const totalWords = analytics.reduce((acc, item) => acc + item.wordCount, 0);
  const totalPages = analytics.reduce((acc, item) => acc + (item.pageCount ?? 0), 0);
  const totalReadingHours = Math.round((totalWords / 200 / 60) * 10) / 10;
  const avgWordsGlobal = Math.round(totalWords / Math.max(1, coverage.totals.published));

  const mostWords = [...analytics].sort((a, b) => b.wordCount - a.wordCount)[0];
  const mostProposals = [...analytics].sort((a, b) => b.proposalCount - a.proposalCount)[0];

  return (
    <div className="space-y-10 pb-6">
      {/* Cabecera editorial unificada */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-ink-secondary">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-civic" />
          <span>
            Radiografía léxica y temática · {coverage.totals.parties} programas ·{" "}
            {coverage.totals.published.toLocaleString("es-ES")} medidas
          </span>
        </div>

        <h1 className="font-serif text-3xl font-black leading-[1.1] tracking-tight text-ink sm:text-4xl">
          Vocabulario, prioridades y estilo de cada programa.
        </h1>

        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary">
          Una mirada global sobre cómo habla y qué prioriza cada partido del 29N: qué conceptos
          menciona más que nadie, cómo reparte sus medidas por áreas y cuánto profundiza en cada
          propuesta.
        </p>

        {/* 4 indicadores globales del corpus */}
        <div className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4">
          <div className="rounded-[4px] border border-line bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Volumen total analizado
            </p>
            <p className="mt-1 text-xl font-black text-ink sm:text-2xl">
              {totalWords.toLocaleString("es-ES")} pal.
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              {totalPages.toLocaleString("es-ES")} págs. · ~{totalReadingHours} h de lectura
            </p>
          </div>

          <div className="rounded-[4px] border border-line bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Programa más extenso
            </p>
            <p className="mt-1 text-xl font-black text-ink sm:text-2xl">
              {mostWords ? (
                <Link
                  href={`/programas/${mostWords.partyId}`}
                  className="hover:text-civic hover:underline"
                >
                  {mostWords.shortName}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              {mostWords
                ? `${mostWords.wordCount.toLocaleString("es-ES")} palabras (~${mostWords.readingLabel})`
                : ""}
            </p>
          </div>

          <div className="rounded-[4px] border border-line bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Más medidas publicadas
            </p>
            <p className="mt-1 text-xl font-black text-ink sm:text-2xl">
              {mostProposals ? (
                <Link
                  href={`/programas/${mostProposals.partyId}`}
                  className="hover:text-civic hover:underline"
                >
                  {mostProposals.shortName}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              {mostProposals ? `${mostProposals.proposalCount} medidas indexadas` : ""}
            </p>
          </div>

          <div className="rounded-[4px] border border-line bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Densidad media del corpus
            </p>
            <p className="mt-1 text-xl font-black text-ink sm:text-2xl">
              ~{avgWordsGlobal} pal./medida
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Extensión promedio de cada propuesta
            </p>
          </div>
        </div>
      </header>

      {/* Explorador interactivo con 3 pestañas */}
      <VocabularyStatsExplorer analytics={analytics} conceptRadar={conceptRadar} />
    </div>
  );
}
