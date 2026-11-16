import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CorpusDatasetSchema,
  CoverageReportSchema,
  isProposalPublishable,
  SurveyDatasetSchema,
} from "./schema.ts";
import {
  computeAllPartyAnalytics,
  computeConceptRadar,
  type ConceptRadarItem,
  type PartyProgramAnalytics,
} from "./stats.ts";
import type {
  CorpusDataset,
  CoverageReport,
  Party,
  PartyId,
  Program,
  Proposal,
  PublicProposal,
  SourceDocument,
  SurveyDataset,
  SurveyQuestion,
  Theme,
} from "./types";

const GENERATED_DIR = path.resolve(process.cwd(), ".generated");

let cachedCorpus: CorpusDataset | null = null;
let cachedCoverage: CoverageReport | null = null;
let cachedSurvey: SurveyDataset | null = null;

export function toPublicProposal(proposal: Proposal): PublicProposal {
  return proposal;
}

export async function loadCorpusDataset(): Promise<CorpusDataset> {
  if (cachedCorpus && process.env.NODE_ENV === "production") {
    return cachedCorpus;
  }
  const filePath = path.join(GENERATED_DIR, "corpus.v1.json");
  const raw = await readFile(filePath, "utf-8");
  const parsed = CorpusDatasetSchema.parse(JSON.parse(raw));
  cachedCorpus = parsed;
  return parsed;
}

export async function loadCoverageReport(): Promise<CoverageReport> {
  if (cachedCoverage && process.env.NODE_ENV === "production") {
    return cachedCoverage;
  }
  const filePath = path.join(GENERATED_DIR, "reports", "coverage-report.json");
  const raw = await readFile(filePath, "utf-8");
  const parsed = CoverageReportSchema.parse(JSON.parse(raw));
  cachedCoverage = parsed;
  return parsed;
}

export async function loadSurveyDataset(): Promise<SurveyDataset> {
  if (cachedSurvey && process.env.NODE_ENV === "production") {
    return cachedSurvey;
  }
  const filePath = path.join(GENERATED_DIR, "survey.v1.json");
  const raw = await readFile(filePath, "utf-8");
  const parsed = SurveyDatasetSchema.parse(JSON.parse(raw));
  cachedSurvey = parsed;
  return parsed;
}

export async function getParties(): Promise<Party[]> {
  const corpus = await loadCorpusDataset();
  return [...corpus.parties].sort((a, b) =>
    (a.name.value ?? a.id).localeCompare(b.name.value ?? b.id, "es"),
  );
}

export async function getPartyById(id: string): Promise<Party | null> {
  const corpus = await loadCorpusDataset();
  return corpus.parties.find((p) => p.id === id) ?? null;
}

export async function getProgramByPartyId(partyId: string): Promise<Program | null> {
  const corpus = await loadCorpusDataset();
  return corpus.programs.find((p) => p.party_id === partyId) ?? null;
}

export async function getSourceDocumentById(docId: string): Promise<SourceDocument | null> {
  const corpus = await loadCorpusDataset();
  return corpus.documents.find((d) => d.id === docId) ?? null;
}

export async function getThemes(options?: { onlyCanonical?: boolean }): Promise<Theme[]> {
  const corpus = await loadCorpusDataset();
  const list = options?.onlyCanonical ? corpus.themes.filter((t) => t.is_canonical) : corpus.themes;
  return [...list].sort((a, b) => a.order - b.order);
}

export async function getPublishedProposals(): Promise<PublicProposal[]> {
  const corpus = await loadCorpusDataset();
  return corpus.proposals.filter(isProposalPublishable).map(toPublicProposal);
}

export async function getPublishedProposalsByParty(partyId: PartyId): Promise<PublicProposal[]> {
  const corpus = await loadCorpusDataset();
  return corpus.proposals
    .filter((p) => p.party_id === partyId && isProposalPublishable(p))
    .map(toPublicProposal);
}

export async function getProposalsByPartyAndTheme(
  partyId: PartyId,
  themeId: string,
): Promise<PublicProposal[]> {
  const corpus = await loadCorpusDataset();
  return corpus.proposals
    .filter((p) => p.party_id === partyId && p.theme_id === themeId && isProposalPublishable(p))
    .map(toPublicProposal);
}

export async function getPublishedProposalsMapByIds(
  ids: string[],
): Promise<Record<string, PublicProposal>> {
  const wanted = new Set(ids);
  const corpus = await loadCorpusDataset();
  const result: Record<string, PublicProposal> = {};
  for (const proposal of corpus.proposals) {
    if (wanted.has(proposal.id) && isProposalPublishable(proposal)) {
      result[proposal.id] = toPublicProposal(proposal);
    }
  }
  return result;
}

export async function getSurveyQuestions(): Promise<SurveyQuestion[]> {
  const survey = await loadSurveyDataset();
  return survey.questions;
}

let cachedAnalytics: PartyProgramAnalytics[] | null = null;
let cachedConceptRadar: ConceptRadarItem[] | null = null;

export async function getAllPartyAnalytics(): Promise<PartyProgramAnalytics[]> {
  if (cachedAnalytics && process.env.NODE_ENV === "production") {
    return cachedAnalytics;
  }
  const corpus = await loadCorpusDataset();
  const published = corpus.proposals.filter(isProposalPublishable).map(toPublicProposal);
  const result = computeAllPartyAnalytics({
    parties: corpus.parties,
    programs: corpus.programs,
    documents: corpus.documents,
    proposals: published,
    themes: corpus.themes,
  });
  cachedAnalytics = result;
  return result;
}

export async function getPartyAnalyticsById(
  partyId: string,
): Promise<PartyProgramAnalytics | null> {
  const all = await getAllPartyAnalytics();
  return all.find((item) => item.partyId === partyId) ?? null;
}

export async function getConceptRadar(): Promise<ConceptRadarItem[]> {
  if (cachedConceptRadar && process.env.NODE_ENV === "production") {
    return cachedConceptRadar;
  }
  const corpus = await loadCorpusDataset();
  const published = corpus.proposals.filter(isProposalPublishable).map(toPublicProposal);
  const result = computeConceptRadar(published, corpus.parties);
  cachedConceptRadar = result;
  return result;
}
