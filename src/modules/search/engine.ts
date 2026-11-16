import { readFile } from "node:fs/promises";
import path from "node:path";
import MiniSearch from "minisearch";
import { z } from "zod";
import { getPublishedProposals, getParties, getThemes } from "../corpus/repository.ts";
import { PartyIdSchema } from "../corpus/schema.ts";
import type { PartyId } from "../corpus/types.ts";
import {
  MINI_SEARCH_FIELDS,
  MINI_SEARCH_STORE_FIELDS,
  processCivicTerm,
  tokenizeCivicText,
  type IndexedAnnotationSource,
  type IndexedProposalDoc,
} from "./text-utils.ts";

const SEARCH_INDEX_PATH = path.join(process.cwd(), ".generated", "search-index.v1.json");

export const SearchQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  parties: z.array(PartyIdSchema).optional().default([]),
  themes: z.array(z.string().min(1)).optional().default([]),
  limit: z.number().int().min(1).max(200).optional().default(60),
  offset: z.number().int().min(0).optional().default(0),
});

export type SearchQuery = z.input<typeof SearchQuerySchema>;

export interface SearchHit {
  id: string;
  legacyId: string;
  partyId: PartyId;
  partyShortName: string;
  partyName: string;
  themeId: string;
  themeTitle: string;
  title: string;
  officialText: string;
  language: string;
  originalSection: string;
  reviewStatus: string;
  isVerified: boolean;
  pages: number[];
  pdfHref: string;
  snippet: string;
  aiSummary: string;
  aiArgumentsFor: string;
  aiArgumentsAgainst: string;
  aiSourcesFor: IndexedAnnotationSource[];
  aiSourcesAgainst: IndexedAnnotationSource[];
  aiFactCheckStatus: IndexedProposalDoc["ai_fact_check_status"];
  score: number;
  termsMatched: string[];
}

export interface SearchResult {
  query: string;
  total: number;
  hits: SearchHit[];
  facets: {
    byParty: Record<string, number>;
    byTheme: Record<string, number>;
    verifiedCount: number;
    unverifiedCount: number;
  };
}

let cachedIndex: MiniSearch<IndexedProposalDoc> | null = null;
let cachedDocs: IndexedProposalDoc[] | null = null;
let runtimePromise: Promise<{
  index: MiniSearch<IndexedProposalDoc>;
  allDocs: IndexedProposalDoc[];
}> | null = null;

async function getSearchRuntime(): Promise<{
  index: MiniSearch<IndexedProposalDoc>;
  allDocs: IndexedProposalDoc[];
}> {
  if (cachedIndex && cachedDocs) {
    return { index: cachedIndex, allDocs: cachedDocs };
  }
  if (runtimePromise) {
    return runtimePromise;
  }

  runtimePromise = (async () => {
    try {
      const [rawJson, proposals, parties, themes] = await Promise.all([
        readFile(SEARCH_INDEX_PATH, "utf-8"),
        getPublishedProposals(),
        getParties(),
        getThemes(),
      ]);

      const index = MiniSearch.loadJSON<IndexedProposalDoc>(rawJson, {
        fields: MINI_SEARCH_FIELDS,
        storeFields: MINI_SEARCH_STORE_FIELDS,
        tokenize: tokenizeCivicText,
        processTerm: processCivicTerm,
      });

      const partyMap = new Map(parties.map((p) => [p.id, p]));
      const themeMap = new Map(themes.map((t) => [t.id, t]));

      const allDocs: IndexedProposalDoc[] = proposals.map((p) => {
        const party = partyMap.get(p.party_id);
        const theme = themeMap.get(p.theme_id);
        const primaryEv = p.evidence[0];
        return {
          id: p.id,
          legacy_id: p.legacy_id,
          party_id: p.party_id,
          party_short_name: party?.short_name.value ?? p.party_id.toUpperCase(),
          party_name: party?.name.value ?? p.party_id,
          theme_id: p.theme_id,
          theme_title: theme?.title ?? p.theme_id,
          title: p.title.text,
          official_text: p.official_text.text,
          language: p.official_text.language,
          original_section: p.original_section.value ?? "",
          review_status: p.review.status,
          is_verified: p.review.status === "verificada" || p.review.status === "corregida",
          pages: primaryEv?.pages ?? [],
          pdf_href: primaryEv?.pdf_href ?? `/pdfs/${p.party_id}.pdf`,
          snippet: primaryEv?.snippet ?? p.official_text.text.slice(0, 280),
          ai_summary: p.ai_annotations.summary,
          ai_arguments_for: p.ai_annotations.arguments_for,
          ai_arguments_against: p.ai_annotations.arguments_against,
          ai_sources_for: p.ai_annotations.sources_for,
          ai_sources_against: p.ai_annotations.sources_against,
          ai_fact_check_status: p.ai_annotations.fact_check.status,
        };
      });

      cachedIndex = index;
      cachedDocs = allDocs;
      return { index, allDocs };
    } finally {
      runtimePromise = null;
    }
  })();

  return runtimePromise;
}

function docToHit(doc: IndexedProposalDoc, score: number, termsMatched: string[]): SearchHit {
  return {
    id: doc.id,
    legacyId: doc.legacy_id,
    partyId: doc.party_id as PartyId,
    partyShortName: doc.party_short_name,
    partyName: doc.party_name,
    themeId: doc.theme_id,
    themeTitle: doc.theme_title,
    title: doc.title,
    officialText: doc.official_text,
    language: doc.language,
    originalSection: doc.original_section,
    reviewStatus: doc.review_status,
    isVerified: doc.is_verified,
    pages: doc.pages,
    pdfHref: doc.pdf_href,
    snippet: doc.snippet,
    aiSummary: doc.ai_summary ?? "",
    aiArgumentsFor: doc.ai_arguments_for ?? "",
    aiArgumentsAgainst: doc.ai_arguments_against ?? "",
    aiSourcesFor: doc.ai_sources_for ?? [],
    aiSourcesAgainst: doc.ai_sources_against ?? [],
    aiFactCheckStatus: doc.ai_fact_check_status ?? "sin_contrastar",
    score,
    termsMatched,
  };
}

export async function searchProposals(rawInput: SearchQuery = {}): Promise<SearchResult> {
  const parsed = SearchQuerySchema.parse(rawInput);
  const { index, allDocs } = await getSearchRuntime();
  const trimmedQuery = parsed.q.trim();

  let baseEntries: Array<{ doc: IndexedProposalDoc; score: number; termsMatched: string[] }>;

  if (trimmedQuery.length > 0) {
    let rawResults = index.search(trimmedQuery, {
      boost: { title: 2, official_text: 1.5, theme_title: 1.2 },
      prefix: true,
      fuzzy: 0.15,
      combineWith: "AND",
    });

    if (rawResults.length === 0 && tokenizeCivicText(trimmedQuery).length > 1) {
      rawResults = index.search(trimmedQuery, {
        boost: { title: 2, official_text: 1.5, theme_title: 1.2 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: "OR",
      });
    }

    baseEntries = rawResults.map((res) => ({
      doc: res as unknown as IndexedProposalDoc,
      score: res.score,
      termsMatched: res.terms ?? [],
    }));
  } else {
    baseEntries = allDocs.map((doc) => ({ doc, score: 1, termsMatched: [] }));
  }

  // Calcular facetas antes de filtrar por la misma dimensión permite explorar cruces reales
  const byParty: Record<string, number> = {};
  const byTheme: Record<string, number> = {};
  let verifiedCount = 0;
  let unverifiedCount = 0;

  const partySet = new Set(parsed.parties);
  const themeSet = new Set(parsed.themes);

  const filtered: Array<{ doc: IndexedProposalDoc; score: number; termsMatched: string[] }> = [];
  for (const entry of baseEntries) {
    const { doc } = entry;
    const partyMatch = partySet.size === 0 || partySet.has(doc.party_id as PartyId);
    const themeMatch = themeSet.size === 0 || themeSet.has(doc.theme_id);

    if (themeMatch) {
      byParty[doc.party_id] = (byParty[doc.party_id] ?? 0) + 1;
    }
    if (partyMatch) {
      byTheme[doc.theme_id] = (byTheme[doc.theme_id] ?? 0) + 1;
    }
    if (partyMatch && themeMatch) {
      if (doc.is_verified) verifiedCount += 1;
      else unverifiedCount += 1;
      filtered.push(entry);
    }
  }

  const hits = filtered
    .slice(parsed.offset, parsed.offset + parsed.limit)
    .map((entry) => docToHit(entry.doc, entry.score, entry.termsMatched));

  return {
    query: trimmedQuery,
    total: filtered.length,
    hits,
    facets: {
      byParty,
      byTheme,
      verifiedCount,
      unverifiedCount,
    },
  };
}
