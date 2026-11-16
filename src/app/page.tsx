import type { CSSProperties } from "react";
import { getCatalogData } from "@/modules/catalog/view-model";
import { getPublishedProposals, getSurveyQuestions, getThemes } from "@/modules/corpus/repository";
import { CongressHemicycle } from "@/modules/home/CongressHemicycle";
import { HeroQuestionSearch } from "@/modules/home/HeroQuestionSearch";
import { HomeTopicSpotlight } from "@/modules/home/HomeTopicSpotlight";
import { PENDING_CONGRESS_PARTIES } from "@/modules/ui/party-colors";

export default async function HomePage() {
  const [{ entries, totals }, canonicalThemes, publishedProposals, questions] = await Promise.all([
    getCatalogData(),
    getThemes({ onlyCanonical: true }),
    getPublishedProposals(),
    getSurveyQuestions(),
  ]);

  const countByTheme = new Map<string, number>();
  for (const proposal of publishedProposals) {
    countByTheme.set(proposal.theme_id, (countByTheme.get(proposal.theme_id) ?? 0) + 1);
  }

  const themesWithCounts = canonicalThemes.map((theme) => ({
    theme,
    count: countByTheme.get(theme.id) ?? 0,
  }));

  return (
    <div className="space-y-12 pb-6">
      {/* Cabecera editorial propia */}
      <section className="home-hero-stage grid grid-cols-1 items-center gap-8 border-b border-line pb-8 pt-2 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-ink-secondary">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-civic" />
            <span>
              Atlas Electoral 29N · {totals.parties} programas ·{" "}
              {totals.published.toLocaleString("es-ES")} medidas
            </span>
          </div>

          <h1 className="font-serif text-3xl font-black leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-[2.85rem]">
            Todo lo que prometen para el 29N, frente a frente y sin letra pequeña.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-ink-secondary">
            Explora el mapa del Congreso y simula mayorías, busca cualquier compromiso con su página
            exacta del PDF o descubre en 5 minutos qué programa encaja contigo.
          </p>
        </div>

        <div style={{ "--hero-delay": "80ms" } as CSSProperties} className="home-hero-stage">
          <HeroQuestionSearch
            totalPrograms={totals.parties}
            pendingCongressCount={PENDING_CONGRESS_PARTIES.length}
          />
        </div>
      </section>

      {/* Hemiciclo interactivo en 2 columnas + Pactómetro + Otras candidaturas */}
      <CongressHemicycle publishedEntries={entries} />

      {/* El termómetro de los debates por ejes */}
      <HomeTopicSpotlight themes={themesWithCounts} questions={questions} />
    </div>
  );
}
