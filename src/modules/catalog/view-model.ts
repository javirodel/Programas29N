import { loadCorpusDataset, loadCoverageReport } from "@/modules/corpus/repository";
import type { CoverageReport } from "@/modules/corpus/types";
import {
  getPartyMeta,
  PENDING_CONGRESS_PARTIES,
  type PartyScope,
  type PendingCongressParty,
} from "@/modules/ui/party-colors";

export interface ThemeCountSummary {
  id: string;
  title: string;
  count: number;
}

export interface CatalogEntry {
  partyId: string;
  partyName: string;
  shortName: string;
  programTitle: string;
  languages: string[];
  publicationDate: string | null;
  documentId: string;
  pdfHref: string;
  sha256: string;
  bytes: number;
  pageCount: number;
  extractedCount: number;
  publishedCount: number;
  verifiedCount: number;
  requiresReviewCount: number;
  reservedCount: number;
  website: string | null;
  outgoingCongressSeats: number | null;
  scope: PartyScope;
  territory: string;
  topThemes: ThemeCountSummary[];
}

export async function getCatalogData(): Promise<{
  entries: CatalogEntry[];
  pendingCongressParties: PendingCongressParty[];
  totals: CoverageReport["totals"];
  generatedAt: string;
}> {
  const [corpus, coverage] = await Promise.all([loadCorpusDataset(), loadCoverageReport()]);

  const partyMap = new Map(corpus.parties.map((p) => [p.id, p]));
  const programMap = new Map(corpus.programs.map((pr) => [pr.party_id, pr]));
  const docMap = new Map(corpus.documents.map((d) => [d.id, d]));
  const themeTitleMap = new Map(corpus.themes.map((t) => [t.id, t.title]));

  const entries: CatalogEntry[] = coverage.by_party
    .map((summary) => {
      const party = partyMap.get(summary.party_id);
      const program = programMap.get(summary.party_id);
      const doc = docMap.get(summary.document_id);
      const meta = getPartyMeta(summary.party_id);
      const topThemes: ThemeCountSummary[] = program
        ? Object.entries(program.stats.by_theme)
            .filter(([, stat]) => stat.published > 0)
            .sort((a, b) => b[1].published - a[1].published)
            .slice(0, 3)
            .map(([themeId, stat]) => ({
              id: themeId,
              title: themeTitleMap.get(themeId) ?? themeId,
              count: stat.published,
            }))
        : [];

      return {
        partyId: summary.party_id,
        partyName: party?.name.value ?? summary.party_name,
        shortName: party?.short_name.value ?? summary.short_name,
        programTitle: program?.title.value ?? `Programa electoral 29N — ${summary.short_name}`,
        languages: program?.languages ?? ["es"],
        publicationDate: program?.publication_date.value ?? null,
        documentId: summary.document_id,
        pdfHref: `/pdfs/${summary.document_id}.pdf`,
        sha256: summary.sha256,
        bytes: summary.bytes,
        pageCount: summary.page_count,
        extractedCount: summary.extracted,
        publishedCount: summary.published,
        verifiedCount: summary.verified,
        requiresReviewCount: summary.requires_review,
        reservedCount: summary.reserved,
        website: party?.website.value ?? doc?.official_url.value ?? null,
        outgoingCongressSeats: meta.outgoingCongressSeats,
        scope: meta.scope,
        territory: meta.territory,
        topThemes,
      };
    })
    .sort((a, b) => a.partyName.localeCompare(b.partyName, "es"));

  return {
    entries,
    pendingCongressParties: PENDING_CONGRESS_PARTIES,
    totals: coverage.totals,
    generatedAt: coverage.generated_at,
  };
}
