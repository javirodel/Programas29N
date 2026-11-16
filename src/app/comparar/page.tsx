import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparatorView, type PartyCompareStats } from "@/modules/comparator/ComparatorView";
import {
  getParties,
  getPublishedProposals,
  getSurveyQuestions,
  getThemes,
  loadCorpusDataset,
} from "@/modules/corpus/repository";
import { PartyIdSchema } from "@/modules/corpus/schema";
import type { PartyId } from "@/modules/corpus/types";

export const metadata: Metadata = {
  title: "Comparador de Programas | 29N",
  description:
    "Compara lado a lado qué propone cada partido del 29N en cada tema, con cita literal y enlace exacto a la página del PDF oficial.",
};

interface CompararPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompararPage({ searchParams }: CompararPageProps) {
  const sp = await searchParams;
  const rawList =
    typeof sp.partidos === "string"
      ? sp.partidos
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const parsedIds: PartyId[] = rawList
    .map((id) => PartyIdSchema.safeParse(id))
    .filter((res) => res.success)
    .map((res) => res.data);

  const [parties, themes, proposals, questions, corpus] = await Promise.all([
    getParties(),
    getThemes(),
    getPublishedProposals(),
    getSurveyQuestions(),
    loadCorpusDataset(),
  ]);

  const documentMap = new Map(corpus.documents.map((doc) => [doc.id, doc]));
  const pdfByParty = new Map<string, string>();
  for (const proposal of proposals) {
    if (!pdfByParty.has(proposal.party_id) && proposal.evidence[0]?.pdf_href) {
      pdfByParty.set(proposal.party_id, proposal.evidence[0].pdf_href.split("#")[0] ?? "");
    }
  }

  const partyStatsMap: Record<string, PartyCompareStats> = {};
  for (const program of corpus.programs) {
    const doc = documentMap.get(program.source_document_id);
    partyStatsMap[program.party_id] = {
      proposalCount: program.stats.published,
      pageCount: doc?.page_count ?? null,
      pdfHref: pdfByParty.get(program.party_id) ?? null,
    };
  }

  const defaultPriority: PartyId[] = ["pp", "psoe", "vox"];
  const fallbackIds = defaultPriority.filter((id) => parties.some((p) => p.id === id));
  const initialPartyIds: PartyId[] =
    parsedIds.length >= 2
      ? Array.from(new Set(parsedIds)).slice(0, 4)
      : fallbackIds.length >= 2
        ? fallbackIds
        : parties.slice(0, 3).map((p) => p.id);

  const rawBlock = typeof sp.bloque === "string" ? sp.bloque : "";
  const validBlock = themes.some((t) => t.id === rawBlock) ? rawBlock : "summary";

  const selectedSet = new Set(initialPartyIds);
  const themeCountsByParty: Record<string, Record<string, number>> = {};
  for (const p of proposals) {
    let byTheme = themeCountsByParty[p.party_id];
    if (!byTheme) {
      byTheme = {};
      themeCountsByParty[p.party_id] = byTheme;
    }
    byTheme[p.theme_id] = (byTheme[p.theme_id] ?? 0) + 1;
  }

  const scopedProposals =
    validBlock === "summary"
      ? []
      : proposals.filter((p) => selectedSet.has(p.party_id) && p.theme_id === validBlock);

  return (
    <Suspense
      fallback={
        <p className="rounded-[3px] border border-line bg-surface p-6 text-center text-base text-ink-secondary">
          Cargando comparador…
        </p>
      }
    >
      <ComparatorView
        parties={parties}
        themes={themes}
        proposals={scopedProposals}
        questions={questions}
        evidenceProposalsMap={evidenceProposalsMap(questions, proposals, selectedSet)}
        partyStatsMap={partyStatsMap}
        initialPartyIds={initialPartyIds}
        initialThemeFilter={validBlock}
        themeCountsByParty={themeCountsByParty}
        loadedBlockId={validBlock}
        loadedPartyIds={initialPartyIds}
      />
    </Suspense>
  );
}

function evidenceProposalsMap(
  questions: Awaited<ReturnType<typeof getSurveyQuestions>>,
  proposals: Awaited<ReturnType<typeof getPublishedProposals>>,
  selectedSet: Set<PartyId>,
) {
  const cited = new Set<string>();
  for (const question of questions) {
    for (const [partyId, pos] of Object.entries(question.positions)) {
      if (!selectedSet.has(partyId as PartyId)) continue;
      for (const pid of pos.evidence_proposal_ids) {
        cited.add(pid);
      }
    }
  }
  const map: Record<string, (typeof proposals)[number]> = {};
  for (const p of proposals) {
    if (cited.has(p.id)) {
      map[p.id] = p;
    }
  }
  return map;
}
