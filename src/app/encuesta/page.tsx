import type { Metadata } from "next";
import {
  getParties,
  getPublishedProposalsMapByIds,
  getSurveyQuestions,
  getThemes,
} from "@/modules/corpus/repository";
import { SurveyClient } from "@/modules/survey/SurveyClient";

export const metadata: Metadata = {
  title: "Test de afinidad | 29N",
  description:
    "Test cívico de 5 minutos (15 preguntas) calculado localmente en tu navegador sobre los programas electorales oficiales del 29N.",
};

export default async function EncuestaPage() {
  const [questions, parties, themes] = await Promise.all([
    getSurveyQuestions(),
    getParties(),
    getThemes(),
  ]);

  const citedIds = new Set<string>();
  for (const question of questions) {
    for (const pos of Object.values(question.positions)) {
      for (const pid of pos.evidence_proposal_ids) {
        citedIds.add(pid);
      }
    }
  }

  const evidenceProposalsMap = await getPublishedProposalsMapByIds(Array.from(citedIds));

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-6">
      <header className="space-y-4 border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-ink-secondary">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-civic" />
          <span>
            Test de afinidad · {questions.length} debates clave · Cálculo 100 % en tu navegador
          </span>
        </div>

        <h1 className="font-serif text-3xl font-black leading-[1.1] tracking-tight text-ink sm:text-4xl">
          Descubre qué programa del 29N coincide más contigo.
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-ink-secondary">
          Valora cada afirmación sin registro ni rastreo y compara tus respuestas con los{" "}
          {parties.length} programas publicados, con enlace directo a la página exacta de cada PDF.
        </p>
      </header>

      <SurveyClient
        questions={questions}
        parties={parties}
        themes={themes}
        evidenceProposalsMap={evidenceProposalsMap}
      />
    </div>
  );
}
