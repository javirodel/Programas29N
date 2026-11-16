import type { Party, Program, PublicProposal, SourceDocument, Theme } from "./types";

export type MacroAreaId = "economia" | "bienestar" | "instituciones" | "exterior";

export interface MacroAreaItem {
  id: MacroAreaId;
  label: string;
  count: number;
  percentage: number;
}

export interface ThemeDistributionItem {
  themeId: string;
  title: string;
  order: number;
  count: number;
  percentage: number;
}

export interface DistinctiveTerm {
  term: string;
  count: number;
  score: number;
}

export interface PartyProgramAnalytics {
  partyId: string;
  shortName: string;
  partyName: string;
  proposalCount: number;
  pageCount: number | null;
  wordCount: number;
  avgWordsPerProposal: number;
  uniqueTermCount: number;
  readingMinutes: number;
  readingLabel: string;
  themeCount: number;
  topThreeConcentrationPct: number;
  macroAreas: MacroAreaItem[];
  themeDistribution: ThemeDistributionItem[];
  distinctiveTerms: DistinctiveTerm[];
  topFrequentTerms: DistinctiveTerm[];
}

export interface ConceptPartyMetric {
  partyId: string;
  shortName: string;
  partyName: string;
  mentions: number;
  per100Proposals: number;
}

export interface ConceptRadarItem {
  id: string;
  label: string;
  query: string;
  totalMentions: number;
  parties: ConceptPartyMetric[];
}

const STOPWORDS = new Set([
  // Castellano (artículos, preposiciones, pronombres, conjunciones, auxiliares frecuentes)
  "para",
  "como",
  "con",
  "sin",
  "sobre",
  "entre",
  "hacia",
  "hasta",
  "desde",
  "durante",
  "mediante",
  "ante",
  "bajo",
  "tras",
  "contra",
  "segun",
  "todo",
  "toda",
  "todos",
  "todas",
  "cada",
  "otro",
  "otra",
  "otros",
  "otras",
  "mismo",
  "misma",
  "mismos",
  "mismas",
  "esta",
  "este",
  "esto",
  "estos",
  "estas",
  "ese",
  "esa",
  "esos",
  "esas",
  "aquel",
  "aquella",
  "aquellos",
  "aquellas",
  "cual",
  "cuales",
  "quien",
  "quienes",
  "donde",
  "cuando",
  "como",
  "porque",
  "aunque",
  "sino",
  "pero",
  "mas",
  "menos",
  "muy",
  "mucho",
  "mucha",
  "muchos",
  "muchas",
  "poco",
  "poca",
  "pocos",
  "pocas",
  "tanto",
  "tanta",
  "tantos",
  "tantas",
  "solo",
  "sola",
  "solamente",
  "tambien",
  "ademas",
  "asimismo",
  "incluso",
  "nunca",
  "siempre",
  "ahora",
  "antes",
  "despues",
  "luego",
  "mientras",
  "traves",
  "frente",
  "junto",
  "dentro",
  "fuera",
  "cerca",
  "lejos",
  "unos",
  "unas",
  "uno",
  "una",
  "los",
  "las",
  "del",
  "por",
  "que",
  "son",
  "ser",
  "sido",
  "sea",
  "sean",
  "esta",
  "estan",
  "estar",
  "estando",
  "tiene",
  "tienen",
  "tener",
  "tenga",
  "tendran",
  "tendra",
  "hacer",
  "hace",
  "hacen",
  "hacia",
  "hecho",
  "puede",
  "pueden",
  "poder",
  "pueda",
  "debe",
  "deben",
  "deber",
  "debera",
  "habra",
  "haber",
  "haya",
  "sido",
  "sera",
  "seran",
  "partir",
  "forma",
  "nivel",
  "caso",
  "casos",
  "parte",
  "partes",
  "tipo",
  "tipos",
  "ano",
  "anos",
  "anio",
  "anios",
  "nuevo",
  "nueva",
  "nuevos",
  "nuevas",
  "mayor",
  "mejor",
  "gran",
  "grande",
  "grandes",
  "nacional",
  "espana",
  "estado",
  "ley",
  "sistema",
  "medidas",
  "medida",
  "politicas",
  "politica",
  "programa",
  "publica",
  "publico",
  "publicos",
  "publicas",
  "general",
  "generales",
  "social",
  "sociales",
  // Català / Valencià
  "amb",
  "per",
  "dels",
  "les",
  "els",
  "una",
  "uns",
  "unes",
  "com",
  "mes",
  "molt",
  "tot",
  "tota",
  "tots",
  "totes",
  "aquest",
  "aquesta",
  "aquests",
  "aquestes",
  "seva",
  "seves",
  "seua",
  "seues",
  "nostra",
  "nostre",
  "nostres",
  "pais",
  "entre",
  "sense",
  "tambe",
  "cal",
  "fer",
  "fent",
  "impulsar",
  "garantir",
  "millorar",
  "crear",
  // Galego
  "dos",
  "das",
  "nun",
  "nunha",
  "cun",
  "cunha",
  "para",
  "polo",
  "pola",
  "polos",
  "polas",
  "coa",
  "coas",
  "senon",
  "mais",
  "tamén",
  "tamen",
  "deste",
  "desta",
  "nesta",
  "neste",
  "xunta",
  "galega",
  "galego",
  "galicia",
  "pais",
  // Verbos programáticos genéricos muy repetidos en todos
  "garantizar",
  "impulsar",
  "fomentar",
  "promover",
  "desarrollar",
  "establecer",
  "reforzar",
  "crear",
  "mejorar",
  "ampliar",
  "reducir",
  "eliminar",
  "asegurar",
  "facilitar",
  "proteger",
  "apoyar",
  "realizar",
  "llevar",
  "cabo",
  "como",
  "donde",
  "cuyo",
  "cuya",
]);

function normalizeToken(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function tokenizeDisplayWords(text: string): Array<{ raw: string; norm: string }> {
  const matches = text.match(/[\p{L}]{4,}/gu) ?? [];
  const tokens: Array<{ raw: string; norm: string }> = [];
  for (const raw of matches) {
    const cleanRaw = raw.toLowerCase();
    const norm = normalizeToken(cleanRaw);
    if (norm.length < 4) continue;
    if (STOPWORDS.has(norm)) continue;
    tokens.push({ raw: cleanRaw, norm });
  }
  return tokens;
}

export function formatReadingDuration(words: number): { minutes: number; label: string } {
  const minutes = Math.max(1, Math.round(words / 200));
  if (minutes < 60) {
    return { minutes, label: `${minutes} min` };
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return {
    minutes,
    label: rem > 0 ? `${hours} h ${rem} min` : `${hours} h`,
  };
}

const MACRO_AREA_DEFS: Array<{ id: MacroAreaId; label: string; themeIds: string[] }> = [
  {
    id: "bienestar",
    label: "Bienestar, vivienda y servicios públicos",
    themeIds: [
      "sanidad",
      "educacion",
      "vivienda",
      "pensiones-bienestar",
      "familia-infancia",
      "cultura",
    ],
  },
  {
    id: "economia",
    label: "Economía, impuestos y sector productivo",
    themeIds: ["economia", "fiscalidad", "empleo", "infraestructuras", "energia", "rural"],
  },
  {
    id: "instituciones",
    label: "Instituciones, justicia y modelo territorial",
    themeIds: [
      "territorial",
      "regeneracion",
      "administracion",
      "justicia-seguridad",
      "emergencias",
    ],
  },
  {
    id: "exterior",
    label: "Fronteras, política exterior y defensa",
    themeIds: ["inmigracion", "defensa-exterior"],
  },
];

const MACRO_AREA_BY_THEME: Record<string, MacroAreaId> = (() => {
  const map: Record<string, MacroAreaId> = {};
  for (const area of MACRO_AREA_DEFS) {
    for (const tid of area.themeIds) {
      map[tid] = area.id;
    }
  }
  return map;
})();

const CONCEPT_DEFS: Array<{ id: string; label: string; query: string; stems: string[] }> = [
  {
    id: "vivienda",
    label: "Vivienda",
    query: "vivienda",
    stems: ["viviend", "vivend", "habitatg"],
  },
  {
    id: "alquiler",
    label: "Alquiler",
    query: "alquiler",
    stems: ["alquil", "lloguer", "alugueir"],
  },
  {
    id: "impuestos",
    label: "Impuestos",
    query: "impuestos",
    stems: ["impuest", "impost", "tribut", "irpf"],
  },
  { id: "autonomos", label: "Autónomos", query: "autónomos", stems: ["autonom"] },
  { id: "pensiones", label: "Pensiones", query: "pensiones", stems: ["pension", "jubilac"] },
  { id: "sanidad", label: "Sanidad", query: "sanidad", stems: ["sanid", "sanit", "salut"] },
  {
    id: "educacion",
    label: "Educación",
    query: "educación",
    stems: ["educac", "universid", "escol"],
  },
  { id: "nuclear", label: "Nuclear", query: "nuclear", stems: ["nuclear"] },
  { id: "renovables", label: "Renovables", query: "renovables", stems: ["renovab"] },
  { id: "agua", label: "Agua", query: "agua", stems: ["agua", "aigua", "auga", "hidric"] },
  {
    id: "campo",
    label: "Campo / Agrario",
    query: "agricultura",
    stems: ["agric", "ganad", "agrari", "pesca"],
  },
  { id: "inmigracion", label: "Inmigración", query: "inmigración", stems: ["inmigr", "migrac"] },
  {
    id: "seguridad",
    label: "Seguridad",
    query: "seguridad",
    stems: ["segurid", "seguret", "polic"],
  },
  {
    id: "corrupcion",
    label: "Corrupción",
    query: "corrupción",
    stems: ["corrupc", "transparenc", "aforam"],
  },
  { id: "familia", label: "Familia", query: "familia", stems: ["famil", "conciliac", "natalid"] },
  {
    id: "defensa",
    label: "Defensa / OTAN",
    query: "defensa",
    stems: ["defens", "otan", "militar"],
  },
];

export function computeConceptRadar(
  proposals: PublicProposal[],
  parties: Party[],
): ConceptRadarItem[] {
  const countsByParty = new Map<string, number>();
  const conceptCounts = new Map<string, Map<string, number>>();
  for (const c of CONCEPT_DEFS) {
    conceptCounts.set(c.id, new Map());
  }

  for (const p of proposals) {
    countsByParty.set(p.party_id, (countsByParty.get(p.party_id) ?? 0) + 1);
    const words = (`${p.title.text} ${p.official_text.text}`.match(/[\p{L}]{3,}/gu) ?? []).map(
      normalizeToken,
    );
    for (const c of CONCEPT_DEFS) {
      let hitsInProposal = 0;
      for (const word of words) {
        if (c.stems.some((stem) => word.startsWith(stem))) {
          hitsInProposal += 1;
        }
      }
      if (hitsInProposal > 0) {
        const partyMap = conceptCounts.get(c.id);
        if (partyMap) {
          partyMap.set(p.party_id, (partyMap.get(p.party_id) ?? 0) + hitsInProposal);
        }
      }
    }
  }

  return CONCEPT_DEFS.map((c) => {
    const map = conceptCounts.get(c.id) ?? new Map<string, number>();
    let totalMentions = 0;
    const partyMetrics: ConceptPartyMetric[] = parties.map((party) => {
      const mentions = map.get(party.id) ?? 0;
      totalMentions += mentions;
      const totalP = Math.max(1, countsByParty.get(party.id) ?? 1);
      return {
        partyId: party.id,
        shortName: party.short_name.value ?? party.id.toUpperCase(),
        partyName: party.name.value ?? party.id,
        mentions,
        per100Proposals: Number(((mentions / totalP) * 100).toFixed(1)),
      };
    });

    partyMetrics.sort((a, b) => b.mentions - a.mentions || b.per100Proposals - a.per100Proposals);

    return {
      id: c.id,
      label: c.label,
      query: c.query,
      totalMentions,
      parties: partyMetrics,
    };
  });
}

export function computeAllPartyAnalytics({
  parties,
  programs,
  documents,
  proposals,
  themes,
}: {
  parties: Party[];
  programs: Program[];
  documents: SourceDocument[];
  proposals: PublicProposal[];
  themes: Theme[];
}): PartyProgramAnalytics[] {
  const programByParty = new Map(programs.map((pr) => [pr.party_id, pr]));
  const docById = new Map(documents.map((doc) => [doc.id, doc]));
  const themeMap = new Map(themes.map((t) => [t.id, t]));

  const proposalsByParty = new Map<string, PublicProposal[]>();
  for (const proposal of proposals) {
    const list = proposalsByParty.get(proposal.party_id) ?? [];
    list.push(proposal);
    proposalsByParty.set(proposal.party_id, list);
  }

  // Contar frecuencias de términos por partido para TF-IDF
  const termCountsByParty = new Map<string, Map<string, { count: number; display: string }>>();
  const totalWordsByParty = new Map<string, number>();
  const docFreqAcrossParties = new Map<string, number>();

  for (const party of parties) {
    const list = proposalsByParty.get(party.id) ?? [];
    const counts = new Map<string, { count: number; display: string }>();
    const seenInParty = new Set<string>();
    let rawWords = 0;

    for (const p of list) {
      const full = `${p.title.text} ${p.official_text.text}`;
      rawWords += full.trim().split(/\s+/).filter(Boolean).length;
      const tokens = tokenizeDisplayWords(full);
      for (const tok of tokens) {
        const prev = counts.get(tok.norm);
        if (prev) {
          prev.count += 1;
        } else {
          counts.set(tok.norm, { count: 1, display: tok.raw });
        }
        seenInParty.add(tok.norm);
      }
    }

    for (const norm of seenInParty) {
      docFreqAcrossParties.set(norm, (docFreqAcrossParties.get(norm) ?? 0) + 1);
    }

    termCountsByParty.set(party.id, counts);
    totalWordsByParty.set(party.id, rawWords);
  }

  const numParties = Math.max(1, parties.length);

  return parties.map((party) => {
    const list = proposalsByParty.get(party.id) ?? [];
    const program = programByParty.get(party.id);
    const doc = program ? docById.get(program.source_document_id) : undefined;

    const themeCounts = new Map<string, number>();
    for (const p of list) {
      themeCounts.set(p.theme_id, (themeCounts.get(p.theme_id) ?? 0) + 1);
    }

    const totalProposals = Math.max(1, list.length);
    const themeDistribution: ThemeDistributionItem[] = Array.from(themeCounts.entries())
      .map(([themeId, count]) => {
        const theme = themeMap.get(themeId);
        return {
          themeId,
          title: theme?.title ?? themeId,
          order: theme?.order ?? 99,
          count,
          percentage: Math.round((count / totalProposals) * 100),
        };
      })
      .sort((a, b) => b.count - a.count || a.order - b.order);

    const wordCount = totalWordsByParty.get(party.id) ?? 0;
    const { minutes, label } = formatReadingDuration(wordCount);

    const partyTermMap = termCountsByParty.get(party.id) ?? new Map();
    const minFreq = list.length >= 250 ? 6 : list.length >= 80 ? 3 : 2;
    const distinctiveTerms: DistinctiveTerm[] = [];

    for (const [norm, entry] of partyTermMap.entries()) {
      if (entry.count < minFreq) continue;
      const df = docFreqAcrossParties.get(norm) ?? 1;
      // TF-IDF suavizado con preferencia por vocabulario característico del partido
      const tf = entry.count / Math.max(100, wordCount);
      const idf = Math.log((numParties + 1) / (df + 0.5));
      if (idf <= 0.1) continue;
      distinctiveTerms.push({
        term: entry.display,
        count: entry.count,
        score: Number((tf * idf * 1000).toFixed(3)),
      });
    }

    distinctiveTerms.sort((a, b) => b.score - a.score || b.count - a.count);

    const topFrequentTerms: DistinctiveTerm[] = Array.from(partyTermMap.values())
      .map((entry) => ({
        term: entry.display,
        count: entry.count,
        score: Number(((entry.count / totalProposals) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const macroCounts = new Map<MacroAreaId, number>();
    for (const p of list) {
      const macroId = MACRO_AREA_BY_THEME[p.theme_id] ?? "instituciones";
      macroCounts.set(macroId, (macroCounts.get(macroId) ?? 0) + 1);
    }
    const macroAreas: MacroAreaItem[] = MACRO_AREA_DEFS.map((area) => {
      const count = macroCounts.get(area.id) ?? 0;
      return {
        id: area.id,
        label: area.label,
        count,
        percentage: Math.round((count / totalProposals) * 100),
      };
    });

    const topThreeConcentrationPct = themeDistribution
      .slice(0, 3)
      .reduce((acc, item) => acc + item.percentage, 0);

    return {
      partyId: party.id,
      shortName: party.short_name.value ?? party.id.toUpperCase(),
      partyName: party.name.value ?? party.id,
      proposalCount: list.length,
      pageCount: doc?.page_count ?? null,
      wordCount,
      avgWordsPerProposal: Math.round(wordCount / totalProposals),
      uniqueTermCount: partyTermMap.size,
      readingMinutes: minutes,
      readingLabel: label,
      themeCount: themeDistribution.length,
      topThreeConcentrationPct,
      macroAreas,
      themeDistribution,
      distinctiveTerms: distinctiveTerms.slice(0, 12),
      topFrequentTerms,
    };
  });
}
