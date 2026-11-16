const SPANISH_AND_GALICIAN_STOPWORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "al",
  "en",
  "por",
  "para",
  "con",
  "sin",
  "sobre",
  "entre",
  "hacia",
  "hasta",
  "desde",
  "que",
  "se",
  "su",
  "sus",
  "como",
  "mas",
  "pero",
  "o",
  "u",
  "y",
  "e",
  "a",
  "o",
  "os",
  "as",
  "do",
  "da",
  "dos",
  "das",
  "no",
  "na",
  "nos",
  "nas",
  "unha",
  "polo",
  "pola",
]);

export function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function tokenizeCivicText(text: string): string[] {
  return text
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}+-]+/u)
    .map((t) => t.replace(/^[+-]+|[+-]+$/g, ""))
    .filter((t) => t.length >= 2);
}

export function processCivicTerm(term: string): string | null {
  const normalized = stripDiacritics(term).trim();
  if (normalized.length < 2) {
    return null;
  }
  if (SPANISH_AND_GALICIAN_STOPWORDS.has(normalized)) {
    return null;
  }
  return normalized;
}

export interface IndexedProposalDoc {
  id: string;
  legacy_id: string;
  party_id: string;
  party_short_name: string;
  party_name: string;
  theme_id: string;
  theme_title: string;
  title: string;
  official_text: string;
  language: string;
  original_section: string;
  review_status: string;
  is_verified: boolean;
  pages: number[];
  pdf_href: string;
  snippet: string;
  ai_summary: string;
  ai_arguments_for: string;
  ai_arguments_against: string;
  ai_sources_for: IndexedAnnotationSource[];
  ai_sources_against: IndexedAnnotationSource[];
  ai_fact_check_status: "sin_contrastar" | "contrastada" | "corregida";
}

export interface IndexedAnnotationSource {
  title: string;
  publisher: string;
  url: string;
  date?: string;
}

export const MINI_SEARCH_FIELDS: (keyof IndexedProposalDoc)[] = [
  "title",
  "official_text",
  "original_section",
  "theme_title",
  "party_short_name",
  "party_name",
  "legacy_id",
];

export const MINI_SEARCH_STORE_FIELDS: (keyof IndexedProposalDoc)[] = [
  "id",
  "legacy_id",
  "party_id",
  "party_short_name",
  "party_name",
  "theme_id",
  "theme_title",
  "title",
  "official_text",
  "language",
  "original_section",
  "review_status",
  "is_verified",
  "pages",
  "pdf_href",
  "snippet",
  "ai_summary",
  "ai_arguments_for",
  "ai_arguments_against",
  "ai_sources_for",
  "ai_sources_against",
  "ai_fact_check_status",
];
