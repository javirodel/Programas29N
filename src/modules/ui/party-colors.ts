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
  // Partidos del Congreso saliente
  "frente-amplio": { bg: "#be185d", fg: "#ffffff", accentBorder: "#ec4899" },
  junts: { bg: "#0f766e", fg: "#ffffff", accentBorder: "#14b8a6" },
  "eh-bildu": { bg: "#65a30d", fg: "#0a0d14", accentBorder: "#84cc16" },
  podemos: { bg: "#7e22ce", fg: "#ffffff", accentBorder: "#a855f7" },
  upn: { bg: "#1e40af", fg: "#ffffff", accentBorder: "#3b82f6" },
  "geroa-bai": { bg: "#b91c1c", fg: "#ffffff", accentBorder: "#ef4444" },
  "partido-autonomos": { bg: "#0e7490", fg: "#ffffff", accentBorder: "#06b6d4" },
  pfac: { bg: "#6b21a8", fg: "#ffffff", accentBorder: "#a855f7" },
  upc: { bg: "#166534", fg: "#ffffff", accentBorder: "#22c55e" },
  "drago-canarias": { bg: "#047857", fg: "#ffffff", accentBorder: "#10b981" },
};

const PARTY_META: Record<string, PartyInstitutionalMeta> = {
  pp: { outgoingCongressSeats: 137, scope: "estatal", territory: "Ámbito estatal" },
  psoe: { outgoingCongressSeats: 121, scope: "estatal", territory: "Ámbito estatal" },
  vox: { outgoingCongressSeats: 33, scope: "estatal", territory: "Ámbito estatal" },
  "frente-amplio": { outgoingCongressSeats: 25, scope: "estatal", territory: "Ámbito estatal" },
  erc: { outgoingCongressSeats: 7, scope: "autonomico", territory: "Cataluña" },
  junts: { outgoingCongressSeats: 7, scope: "autonomico", territory: "Cataluña" },
  "eh-bildu": {
    outgoingCongressSeats: 6,
    scope: "autonomico",
    territory: "País Vasco y Navarra",
  },
  pnv: { outgoingCongressSeats: 5, scope: "autonomico", territory: "País Vasco" },
  podemos: { outgoingCongressSeats: 4, scope: "estatal", territory: "Ámbito estatal" },
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
  "geroa-bai": { outgoingCongressSeats: null, scope: "autonomico", territory: "Navarra" },
  "partido-autonomos": {
    outgoingCongressSeats: null,
    scope: "autonomico",
    territory: "C. Valenciana y S. C. Tenerife",
  },
  pfac: { outgoingCongressSeats: null, scope: "autonomico", territory: "Álava y Bizkaia" },
  upc: { outgoingCongressSeats: null, scope: "autonomico", territory: "Canarias" },
  "drago-canarias": { outgoingCongressSeats: null, scope: "autonomico", territory: "Canarias" },
};

export const PENDING_CONGRESS_PARTIES: PendingCongressParty[] = [
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

export interface ConstituencyProvince {
  id: string;
  label: string;
  community: string;
}

export const SPANISH_PROVINCES: ConstituencyProvince[] = [
  { id: "a-coruna", label: "A Coruña", community: "Galicia" },
  { id: "alava", label: "Álava / Araba", community: "País Vasco" },
  { id: "albacete", label: "Albacete", community: "Castilla-La Mancha" },
  { id: "alicante", label: "Alicante / Alacant", community: "Comunitat Valenciana" },
  { id: "almeria", label: "Almería", community: "Andalucía" },
  { id: "asturias", label: "Asturias", community: "Asturias" },
  { id: "avila", label: "Ávila", community: "Castilla y León" },
  { id: "badajoz", label: "Badajoz", community: "Extremadura" },
  { id: "barcelona", label: "Barcelona", community: "Cataluña" },
  { id: "bizkaia", label: "Bizkaia", community: "País Vasco" },
  { id: "burgos", label: "Burgos", community: "Castilla y León" },
  { id: "caceres", label: "Cáceres", community: "Extremadura" },
  { id: "cadiz", label: "Cádiz", community: "Andalucía" },
  { id: "cantabria", label: "Cantabria", community: "Cantabria" },
  { id: "castellon", label: "Castellón / Castelló", community: "Comunitat Valenciana" },
  { id: "ceuta", label: "Ceuta", community: "Ceuta" },
  { id: "ciudad-real", label: "Ciudad Real", community: "Castilla-La Mancha" },
  { id: "cordoba", label: "Córdoba", community: "Andalucía" },
  { id: "cuenca", label: "Cuenca", community: "Castilla-La Mancha" },
  { id: "gipuzkoa", label: "Gipuzkoa", community: "País Vasco" },
  { id: "girona", label: "Girona", community: "Cataluña" },
  { id: "granada", label: "Granada", community: "Andalucía" },
  { id: "guadalajara", label: "Guadalajara", community: "Castilla-La Mancha" },
  { id: "huelva", label: "Huelva", community: "Andalucía" },
  { id: "huesca", label: "Huesca", community: "Aragón" },
  { id: "illes-balears", label: "Illes Balears", community: "Illes Balears" },
  { id: "jaen", label: "Jaén", community: "Andalucía" },
  { id: "la-rioja", label: "La Rioja", community: "La Rioja" },
  { id: "las-palmas", label: "Las Palmas", community: "Canarias" },
  { id: "leon", label: "León", community: "Castilla y León" },
  { id: "lleida", label: "Lleida", community: "Cataluña" },
  { id: "lugo", label: "Lugo", community: "Galicia" },
  { id: "madrid", label: "Madrid", community: "Comunidad de Madrid" },
  { id: "malaga", label: "Málaga", community: "Andalucía" },
  { id: "melilla", label: "Melilla", community: "Melilla" },
  { id: "murcia", label: "Murcia", community: "Región de Murcia" },
  { id: "navarra", label: "Navarra", community: "Navarra" },
  { id: "ourense", label: "Ourense", community: "Galicia" },
  { id: "palencia", label: "Palencia", community: "Castilla y León" },
  { id: "pontevedra", label: "Pontevedra", community: "Galicia" },
  { id: "salamanca", label: "Salamanca", community: "Castilla y León" },
  { id: "santa-cruz-tenerife", label: "Santa Cruz de Tenerife", community: "Canarias" },
  { id: "segovia", label: "Segovia", community: "Castilla y León" },
  { id: "sevilla", label: "Sevilla", community: "Andalucía" },
  { id: "soria", label: "Soria", community: "Castilla y León" },
  { id: "tarragona", label: "Tarragona", community: "Cataluña" },
  { id: "teruel", label: "Teruel", community: "Aragón" },
  { id: "toledo", label: "Toledo", community: "Castilla-La Mancha" },
  { id: "valencia", label: "Valencia / València", community: "Comunitat Valenciana" },
  { id: "valladolid", label: "Valladolid", community: "Castilla y León" },
  { id: "zamora", label: "Zamora", community: "Castilla y León" },
  { id: "zaragoza", label: "Zaragoza", community: "Aragón" },
];

const PROVINCE_MAP = new Map(SPANISH_PROVINCES.map((p) => [p.id, p]));

const TERRITORIAL_PARTY_MATCHERS: Record<string, (prov: ConstituencyProvince) => boolean> = {
  erc: (p) => p.community === "Cataluña",
  junts: (p) => p.community === "Cataluña",
  pnv: (p) => p.community === "País Vasco",
  "eh-bildu": (p) => p.community === "País Vasco" || p.community === "Navarra",
  upn: (p) => p.community === "Navarra",
  compromis: (p) => p.community === "Comunitat Valenciana",
  bng: (p) => p.community === "Galicia",
  "coalicion-canaria": (p) => p.community === "Canarias",
  "adelante-andalucia": (p) => p.community === "Andalucía",
  "teruel-existe": (p) => p.id === "teruel",
  "soria-ya": (p) => p.id === "soria",
  "geroa-bai": (p) => p.community === "Navarra",
  "partido-autonomos": (p) =>
    ["alicante", "castellon", "valencia", "santa-cruz-tenerife"].includes(p.id),
  pfac: (p) => ["alava", "bizkaia"].includes(p.id),
  upc: (p) => p.community === "Canarias",
  "drago-canarias": (p) => p.community === "Canarias",
};

export function isPartyInProvince(partyId: string, provinceId: string): boolean {
  if (!provinceId || provinceId === "all") return true;
  const province = PROVINCE_MAP.get(provinceId);
  if (!province) return true;
  const meta = getPartyMeta(partyId);
  if (meta.scope === "estatal") return true;
  const matcher = TERRITORIAL_PARTY_MATCHERS[partyId];
  if (matcher) return matcher(province);
  return (
    meta.territory.toLowerCase() === province.community.toLowerCase() ||
    meta.territory.toLowerCase() === province.label.toLowerCase()
  );
}
