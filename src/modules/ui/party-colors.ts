export interface PartyVisualIdentity {
  bg: string;
  fg: string;
  accentBorder: string;
}

export type PartyScope = "estatal" | "autonomico";

export interface PartyInstitutionalMeta {
  outgoingCongressSeats: number | null;
  scope: PartyScope;
  territory: string;
}

export interface PendingCongressParty {
  partyId: string;
  shortName: string;
  partyName: string;
  outgoingCongressSeats: number;
  scope: PartyScope;
  territory: string;
  website: string;
  statusNote: string;
}

const DEFAULT_PARTY_VISUAL: PartyVisualIdentity = {
  bg: "#334155",
  fg: "#ffffff",
  accentBorder: "#475569",
};

const PARTY_VISUALS: Record<string, PartyVisualIdentity> = {
  psoe: { bg: "#c8102e", fg: "#ffffff", accentBorder: "#ef4444" },
  pp: { bg: "#0055a4", fg: "#ffffff", accentBorder: "#3b82f6" },
  vox: { bg: "#4e9a26", fg: "#ffffff", accentBorder: "#65a30d" },
  compromis: { bg: "#c2410c", fg: "#ffffff", accentBorder: "#ea580c" },
  erc: { bg: "#f59e0b", fg: "#0a0d14", accentBorder: "#fbbf24" },
  "adelante-andalucia": { bg: "#15803d", fg: "#ffffff", accentBorder: "#22c55e" },
  bng: { bg: "#0284c7", fg: "#ffffff", accentBorder: "#38bdf8" },
  pnv: { bg: "#047857", fg: "#ffffff", accentBorder: "#10b981" },
  "coalicion-canaria": { bg: "#eab308", fg: "#0a0d14", accentBorder: "#facc15" },
  salf: { bg: "#475569", fg: "#ffffff", accentBorder: "#64748b" },
  pacma: { bg: "#6d28d9", fg: "#ffffff", accentBorder: "#8b5cf6" },
  "teruel-existe": { bg: "#1b5e3f", fg: "#ffffff", accentBorder: "#16a34a" },
  "soria-ya": { bg: "#9f1239", fg: "#ffffff", accentBorder: "#e11d48" },
  "frente-obrero": { bg: "#b91c1c", fg: "#ffffff", accentBorder: "#ef4444" },
  "por-un-mundo-mas-justo": { bg: "#0369a1", fg: "#ffffff", accentBorder: "#0ea5e9" },
  "partido-humanista": { bg: "#c2410c", fg: "#ffffff", accentBorder: "#f97316" },
  "iustitia-europa": { bg: "#1d4ed8", fg: "#ffffff", accentBorder: "#60a5fa" },
  falange: { bg: "#1f2937", fg: "#ffffff", accentBorder: "#4b5563" },
  // Partidos del Congreso saliente con programa pendiente de publicación
  "frente-amplio": { bg: "#be185d", fg: "#ffffff", accentBorder: "#ec4899" },
  junts: { bg: "#0f766e", fg: "#ffffff", accentBorder: "#14b8a6" },
  "eh-bildu": { bg: "#65a30d", fg: "#0a0d14", accentBorder: "#84cc16" },
  podemos: { bg: "#7e22ce", fg: "#ffffff", accentBorder: "#a855f7" },
  upn: { bg: "#1e40af", fg: "#ffffff", accentBorder: "#3b82f6" },
};

const PARTY_META: Record<string, PartyInstitutionalMeta> = {
  pp: { outgoingCongressSeats: 137, scope: "estatal", territory: "Ámbito estatal" },
  psoe: { outgoingCongressSeats: 121, scope: "estatal", territory: "Ámbito estatal" },
  vox: { outgoingCongressSeats: 33, scope: "estatal", territory: "Ámbito estatal" },
  "frente-amplio": { outgoingCongressSeats: 25, scope: "estatal", territory: "Ámbito estatal" },
  erc: { outgoingCongressSeats: 7, scope: "autonomico", territory: "Cataluña" },
  "eh-bildu": {
    outgoingCongressSeats: 6,
    scope: "autonomico",
    territory: "País Vasco y Navarra",
  },
  pnv: { outgoingCongressSeats: 5, scope: "autonomico", territory: "País Vasco" },
  compromis: { outgoingCongressSeats: 2, scope: "autonomico", territory: "Comunitat Valenciana" },
  bng: { outgoingCongressSeats: 1, scope: "autonomico", territory: "Galicia" },
  "coalicion-canaria": { outgoingCongressSeats: 1, scope: "autonomico", territory: "Canarias" },
  salf: { outgoingCongressSeats: null, scope: "estatal", territory: "Ámbito estatal" },
  pacma: { outgoingCongressSeats: null, scope: "estatal", territory: "Ámbito estatal" },
  "frente-obrero": { outgoingCongressSeats: null, scope: "estatal", territory: "Ámbito estatal" },
  "por-un-mundo-mas-justo": {
    outgoingCongressSeats: null,
    scope: "estatal",
    territory: "Ámbito estatal",
  },
  "partido-humanista": {
    outgoingCongressSeats: null,
    scope: "estatal",
    territory: "Ámbito estatal",
  },
  "iustitia-europa": { outgoingCongressSeats: null, scope: "estatal", territory: "Ámbito estatal" },
  falange: { outgoingCongressSeats: null, scope: "estatal", territory: "Ámbito estatal" },
  "adelante-andalucia": {
    outgoingCongressSeats: null,
    scope: "autonomico",
    territory: "Andalucía",
  },
  "teruel-existe": { outgoingCongressSeats: null, scope: "autonomico", territory: "Teruel" },
  "soria-ya": { outgoingCongressSeats: null, scope: "autonomico", territory: "Soria" },
};

export const PENDING_CONGRESS_PARTIES: PendingCongressParty[] = [
  {
    partyId: "junts",
    shortName: "Junts",
    partyName: "Junts per Catalunya",
    outgoingCongressSeats: 7,
    scope: "autonomico",
    territory: "Cataluña",
    website: "https://junts.cat",
    statusNote:
      "Formación con representación en el Congreso de los Diputados saliente (XV Legislatura). Todavía no ha publicado un documento programático completo en PDF para el 29N.",
  },
  {
    partyId: "podemos",
    shortName: "Podemos",
    partyName: "Podemos",
    outgoingCongressSeats: 4,
    scope: "estatal",
    territory: "Ámbito estatal",
    website: "https://podemos.info",
    statusNote:
      "Formación con representación en el Congreso de los Diputados saliente (XV Legislatura). Aún no ha publicado un documento programático oficial en PDF para el 29N.",
  },
  {
    partyId: "upn",
    shortName: "UPN",
    partyName: "Unión del Pueblo Navarro",
    outgoingCongressSeats: 1,
    scope: "autonomico",
    territory: "Navarra",
    website: "https://upn.org",
    statusNote:
      "Formación con representación en el Congreso de los Diputados saliente (XV Legislatura). Concurre al 29N en coalición con el PP en Navarra sin un programa electoral autónomo publicado en PDF.",
  },
];

const DEFAULT_META: PartyInstitutionalMeta = {
  outgoingCongressSeats: null,
  scope: "estatal",
  territory: "Ámbito estatal",
};

export function getPartyVisual(partyId: string): PartyVisualIdentity {
  return PARTY_VISUALS[partyId] ?? DEFAULT_PARTY_VISUAL;
}

export function getPartyMeta(partyId: string): PartyInstitutionalMeta {
  return PARTY_META[partyId] ?? DEFAULT_META;
}

export function getPendingCongressParty(partyId: string): PendingCongressParty | undefined {
  return PENDING_CONGRESS_PARTIES.find((p) => p.partyId === partyId);
}
