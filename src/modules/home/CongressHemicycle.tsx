"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { CatalogEntry } from "@/modules/catalog/view-model";
import { buttonClasses } from "@/modules/ui/components/Button";
import {
  getPartyVisual,
  PENDING_CONGRESS_PARTIES,
  type PendingCongressParty,
} from "@/modules/ui/party-colors";

interface CongressHemicycleProps {
  publishedEntries: CatalogEntry[];
}

interface CongressBlocOrder {
  partyId: string;
  seats: number;
}

const CONGRESS_SEATING_ORDER: CongressBlocOrder[] = [
  { partyId: "eh-bildu", seats: 6 },
  { partyId: "bng", seats: 1 },
  { partyId: "erc", seats: 7 },
  { partyId: "podemos", seats: 4 },
  { partyId: "frente-amplio", seats: 25 },
  { partyId: "compromis", seats: 2 },
  { partyId: "psoe", seats: 121 },
  { partyId: "pnv", seats: 5 },
  { partyId: "junts", seats: 7 },
  { partyId: "coalicion-canaria", seats: 1 },
  { partyId: "upn", seats: 1 },
  { partyId: "pp", seats: 137 },
  { partyId: "vox", seats: 33 },
];

const COALITION_PRESETS: Array<{ label: string; ids: string[] }> = [
  { label: "PP + Vox + UPN (171)", ids: ["pp", "vox", "upn"] },
  {
    label: "Investidura XV (179)",
    ids: [
      "psoe",
      "frente-amplio",
      "erc",
      "junts",
      "eh-bildu",
      "pnv",
      "podemos",
      "compromis",
      "bng",
      "coalicion-canaria",
    ],
  },
  { label: "Gran coalición PP + PSOE (258)", ids: ["pp", "psoe"] },
];

const RING_RADII = [118, 139, 160, 181, 202, 223, 244, 265, 286];
const RING_COUNTS = [23, 27, 31, 35, 39, 43, 47, 51, 54]; // Suma exacta = 350
const SVG_WIDTH = 760;
const SVG_HEIGHT = 365;
const SVG_CENTER_X = 380;
const SVG_CENTER_Y = 342;
const TOTAL_CONGRESS_SEATS = 350;
const ABSOLUTE_MAJORITY = 176;
const INITIAL_OTHER_LIMIT = 6;

interface SeatCoord {
  x: number;
  y: number;
  theta: number;
  row: number;
  waveIndex: number;
}

function generateHemicycleSeats(): SeatCoord[] {
  const coords: Omit<SeatCoord, "waveIndex">[] = [];
  const edgePad = 0.035;

  for (let row = 0; row < RING_RADII.length; row++) {
    const r = RING_RADII[row] ?? 118;
    const count = RING_COUNTS[row] ?? 23;
    for (let i = 0; i < count; i++) {
      const ratio = count === 1 ? 0.5 : i / (count - 1);
      const theta = Math.PI - edgePad - ratio * (Math.PI - edgePad * 2);
      coords.push({
        x: Number((SVG_CENTER_X + r * Math.cos(theta)).toFixed(2)),
        y: Number((SVG_CENTER_Y - r * Math.sin(theta)).toFixed(2)),
        theta,
        row,
      });
    }
  }

  return coords
    .sort((a, b) => b.theta - a.theta || a.row - b.row)
    .map((coord, idx) => ({ ...coord, waveIndex: idx }));
}

const HEMICYCLE_COORDS = generateHemicycleSeats();

const SEAT_LOOKUP: Array<{ x: number; y: number; partyId: string }> = [];
const SEAT_SLICES_BY_PARTY: Record<string, SeatCoord[]> = (() => {
  const result: Record<string, SeatCoord[]> = {};
  let cursor = 0;
  for (const item of CONGRESS_SEATING_ORDER) {
    const slice = HEMICYCLE_COORDS.slice(cursor, cursor + item.seats);
    result[item.partyId] = slice;
    for (const coord of slice) {
      SEAT_LOOKUP.push({ x: coord.x, y: coord.y, partyId: item.partyId });
    }
    cursor += item.seats;
  }
  return result;
})();

function runWithViewTransition(action: () => void) {
  if (typeof document !== "undefined") {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(action);
      return;
    }
  }
  action();
}

interface HydratedBloc {
  partyId: string;
  shortName: string;
  partyName: string;
  seats: number;
  territory: string;
  published?: CatalogEntry;
  pending?: PendingCongressParty;
  seatsCoords: SeatCoord[];
  visual: ReturnType<typeof getPartyVisual>;
}

export function CongressHemicycle({ publishedEntries }: CongressHemicycleProps) {
  const [mode, setMode] = useState<"explore" | "coalition">("explore");
  const [selectedPartyId, setSelectedPartyId] = useState<string>("pp");
  const [coalitionIds, setCoalitionIds] = useState<string[]>(["pp", "vox", "upn"]);
  const [otherScopeFilter, setOtherScopeFilter] = useState<"all" | "estatal" | "autonomico">("all");
  const [showAllOther, setShowAllOther] = useState(false);
  const [hemicycleVisible, setHemicycleVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const frame = requestAnimationFrame(() => setHemicycleVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHemicycleVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const entryMap = useMemo(
    () => new Map(publishedEntries.map((entry) => [entry.partyId, entry])),
    [publishedEntries],
  );

  const pendingMap = useMemo(
    () => new Map(PENDING_CONGRESS_PARTIES.map((party) => [party.partyId, party])),
    [],
  );

  const blocs = useMemo<HydratedBloc[]>(() => {
    return CONGRESS_SEATING_ORDER.map((item) => {
      const published = entryMap.get(item.partyId);
      const pending = pendingMap.get(item.partyId);

      return {
        partyId: item.partyId,
        shortName: published?.shortName ?? pending?.shortName ?? item.partyId.toUpperCase(),
        partyName: published?.partyName ?? pending?.partyName ?? item.partyId,
        seats: item.seats,
        territory: published?.territory ?? pending?.territory ?? "España",
        published,
        pending,
        seatsCoords: SEAT_SLICES_BY_PARTY[item.partyId] ?? [],
        visual: getPartyVisual(item.partyId),
      };
    });
  }, [entryMap, pendingMap]);

  const selectedBloc = useMemo(
    () => blocs.find((bloc) => bloc.partyId === selectedPartyId) ?? blocs[0],
    [blocs, selectedPartyId],
  );

  const otherEntries = useMemo(
    () => publishedEntries.filter((e) => e.outgoingCongressSeats === null),
    [publishedEntries],
  );
  const otherCounts = useMemo(
    () => ({
      all: otherEntries.length,
      estatal: otherEntries.filter((e) => e.scope === "estatal").length,
      autonomico: otherEntries.filter((e) => e.scope === "autonomico").length,
    }),
    [otherEntries],
  );
  const filteredOtherEntries = useMemo(() => {
    if (otherScopeFilter === "all") return otherEntries;
    return otherEntries.filter((e) => e.scope === otherScopeFilter);
  }, [otherEntries, otherScopeFilter]);

  const visibleOtherEntries =
    otherScopeFilter !== "all" || showAllOther
      ? filteredOtherEntries
      : filteredOtherEntries.slice(0, INITIAL_OTHER_LIMIT);

  const coalitionSet = useMemo(() => new Set(coalitionIds), [coalitionIds]);
  const coalitionBlocs = useMemo(
    () => blocs.filter((b) => coalitionSet.has(b.partyId)),
    [blocs, coalitionSet],
  );
  const coalitionSeats = useMemo(
    () => coalitionBlocs.reduce((acc, b) => acc + b.seats, 0),
    [coalitionBlocs],
  );
  const coalitionPublishedIds = useMemo(
    () =>
      [...coalitionBlocs]
        .filter((b) => Boolean(b.published))
        .sort((a, b) => b.seats - a.seats)
        .slice(0, 4)
        .map((b) => b.partyId),
    [coalitionBlocs],
  );
  const coalitionCompareHref =
    coalitionPublishedIds.length >= 2
      ? `/comparar?partidos=${encodeURIComponent(coalitionPublishedIds.join(","))}`
      : "/comparar";

  const handleHoverBloc = (partyId: string) => {
    if (mode !== "explore") return;
    setSelectedPartyId(partyId);
  };

  const handleSvgMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (mode !== "explore") return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scale = Math.min(rect.width / SVG_WIDTH, rect.height / SVG_HEIGHT);
    const offsetX = (rect.width - SVG_WIDTH * scale) / 2;
    const offsetY = (rect.height - SVG_HEIGHT * scale) / 2;
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;

    const dist = Math.hypot(x - SVG_CENTER_X, y - SVG_CENTER_Y);
    if (dist < 96 || dist > 304 || y > SVG_CENTER_Y + 12) return;

    let bestParty: string | null = null;
    let bestDistSq = 35 * 35;
    for (const seat of SEAT_LOOKUP) {
      const dx = seat.x - x;
      const dy = seat.y - y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestParty = seat.partyId;
      }
    }

    if (bestParty && bestParty !== selectedPartyId) {
      setSelectedPartyId(bestParty);
    }
  };

  const handleClickBloc = (partyId: string) => {
    if (mode === "coalition") {
      setCoalitionIds((prev) =>
        prev.includes(partyId) ? prev.filter((id) => id !== partyId) : [...prev, partyId],
      );
      return;
    }
    setSelectedPartyId(partyId);
  };

  const switchMode = (next: "explore" | "coalition") => {
    if (next === mode) return;
    runWithViewTransition(() => setMode(next));
  };

  const compareTargets = useMemo(() => {
    if (!selectedBloc?.published) return "/comparar";
    const id = selectedBloc.partyId;
    const defaults = ["pp", "psoe", "vox"].filter((p) => p !== id).slice(0, 2);
    return `/comparar?partidos=${[id, ...defaults].join(",")}`;
  }, [selectedBloc]);

  const hasMajority = coalitionSeats >= ABSOLUTE_MAJORITY;
  const activeId = selectedBloc?.partyId ?? "pp";
  const sharePct = selectedBloc
    ? ((selectedBloc.seats / TOTAL_CONGRESS_SEATS) * 100).toFixed(1).replace(".", ",")
    : "0,0";
  const maxThemeCount = selectedBloc?.published?.topThemes[0]?.count ?? 1;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="congreso-saliente-heading"
      className={`space-y-8 ${hemicycleVisible ? "hemicycle-ready" : ""}`}
    >
      {/* Cabecera del cuadro de mando del Congreso */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Mapa interactivo · Congreso de los Diputados (350 escaños)
          </p>
          <h2
            id="congreso-saliente-heading"
            className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
          >
            {mode === "explore"
              ? "Hemiciclo vivo: inspecciona cada grupo sin perder el hilo"
              : "Pactómetro: combina escaños hacia los 176 de la mayoría"}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Modo del hemiciclo"
          className="inline-flex w-fit rounded-[4px] border border-line bg-surface-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "explore"}
            onClick={() => switchMode("explore")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-bold transition-all ${
              mode === "explore"
                ? "bg-surface text-ink shadow-2xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Explorar partidos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "coalition"}
            onClick={() => switchMode("coalition")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-bold transition-all ${
              mode === "coalition"
                ? "bg-surface text-ink shadow-2xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Pactómetro (176 escaños)
          </button>
        </div>
      </div>

      {/* Layout estable de 2 columnas (altura constante, cero saltos al mover el ratón) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        {/* Columna izquierda: Arco SVG de 350 escaños + chips */}
        <div className="flex flex-col justify-between rounded-[4px] border border-line bg-surface p-4 sm:p-5">
          <div>
            <svg
              ref={svgRef}
              onMouseMove={handleSvgMouseMove}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              role="img"
              aria-labelledby="hemicycle-svg-title hemicycle-svg-desc"
              className="mx-auto h-auto w-full max-w-2xl select-none overflow-visible"
            >
              <title id="hemicycle-svg-title">
                Hemiciclo del Congreso de los Diputados con 350 escaños distribuidos por candidatura
              </title>
              <desc id="hemicycle-svg-desc">
                Diagrama interactivo de 350 escaños agrupados en 13 bloques políticos. Los círculos
                sólidos indican programas publicados; los círculos discontinuos indican formaciones
                pendientes de publicar su programa.
              </desc>

              <path
                d={`M ${SVG_CENTER_X - 96} ${SVG_CENTER_Y} A 96 96 0 0 1 ${SVG_CENTER_X + 96} ${SVG_CENTER_Y}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.14}
                strokeWidth={1.5}
                strokeDasharray="4 5"
              />

              {blocs.map((bloc) => {
                const isPublished = Boolean(bloc.published);
                const isHighlighted =
                  mode === "coalition" ? coalitionSet.has(bloc.partyId) : activeId === bloc.partyId;
                const isDimmed =
                  mode === "coalition"
                    ? coalitionIds.length > 0 && !isHighlighted
                    : activeId !== bloc.partyId;

                return (
                  <g
                    key={bloc.partyId}
                    role="button"
                    tabIndex={0}
                    aria-label={`${bloc.shortName}: ${bloc.seats} ${bloc.seats === 1 ? "escaño" : "escaños"}${
                      isPublished ? ", programa publicado" : ", programa pendiente"
                    }`}
                    aria-pressed={
                      mode === "coalition"
                        ? coalitionSet.has(bloc.partyId)
                        : activeId === bloc.partyId
                    }
                    onMouseEnter={() => handleHoverBloc(bloc.partyId)}
                    onFocus={() => handleHoverBloc(bloc.partyId)}
                    onClick={() => handleClickBloc(bloc.partyId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClickBloc(bloc.partyId);
                      }
                    }}
                    className="cursor-pointer outline-none"
                    style={{
                      opacity: isDimmed ? 0.34 : 1,
                      transition: "opacity 180ms ease",
                    }}
                  >
                    {bloc.seatsCoords.map((coord, idx) => (
                      <Fragment key={`${bloc.partyId}-${idx}`}>
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={13.5}
                          fill="transparent"
                          className="pointer-events-auto"
                        />
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={isHighlighted ? 7.3 : 6.2}
                          fill={isPublished ? bloc.visual.bg : "var(--color-bg-surface)"}
                          stroke={bloc.visual.bg}
                          strokeWidth={
                            isPublished ? (isHighlighted ? 1.6 : 0) : isHighlighted ? 2.5 : 1.8
                          }
                          strokeDasharray={isPublished ? undefined : "2.5 1.5"}
                          className="hemicycle-seat pointer-events-none"
                          style={
                            {
                              "--seat-delay": `${(coord.waveIndex * 1.2).toFixed(0)}ms`,
                              transition: "r 150ms ease, stroke-width 150ms ease",
                            } as CSSProperties
                          }
                        />
                      </Fragment>
                    ))}
                  </g>
                );
              })}

              {/* Marcador central en vivo */}
              <g aria-hidden="true" className="pointer-events-none">
                <text
                  x={SVG_CENTER_X}
                  y={SVG_CENTER_Y - 26}
                  textAnchor="middle"
                  className="font-black tracking-tight transition-colors duration-200"
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    fill:
                      mode === "coalition"
                        ? hasMajority
                          ? "var(--color-civic)"
                          : "var(--color-text-primary)"
                        : (selectedBloc?.visual.bg ?? "var(--color-text-primary)"),
                  }}
                >
                  {mode === "coalition" ? coalitionSeats : (selectedBloc?.seats ?? 350)}
                </text>
                <text
                  x={SVG_CENTER_X}
                  y={SVG_CENTER_Y - 5}
                  textAnchor="middle"
                  className="fill-ink-muted font-bold uppercase tracking-widest"
                  style={{ fontSize: "10.5px", letterSpacing: "0.08em" }}
                >
                  {mode === "coalition"
                    ? hasMajority
                      ? `Mayoría ≥ ${ABSOLUTE_MAJORITY}`
                      : `De ${ABSOLUTE_MAJORITY} necesarios`
                    : `${selectedBloc?.shortName ?? ""} · ${sharePct}%`}
                </text>
              </g>
            </svg>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex flex-wrap justify-center gap-1.5">
              {blocs.map((bloc) => {
                const isSelected =
                  mode === "coalition" ? coalitionSet.has(bloc.partyId) : activeId === bloc.partyId;
                const isPublished = Boolean(bloc.published);

                return (
                  <button
                    key={`chip-${bloc.partyId}`}
                    type="button"
                    onMouseEnter={() => handleHoverBloc(bloc.partyId)}
                    onFocus={() => handleHoverBloc(bloc.partyId)}
                    onClick={() => handleClickBloc(bloc.partyId)}
                    style={{ borderTopColor: bloc.visual.bg }}
                    className={`inline-flex items-center gap-1.5 rounded-[3px] border border-t-[3px] px-2.5 py-1 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-x-ink border-b-ink bg-ink text-canvas shadow-2xs"
                        : "border-x-line border-b-line bg-canvas text-ink-secondary hover:border-x-line-strong hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={
                        isPublished
                          ? { backgroundColor: isSelected ? "currentColor" : bloc.visual.bg }
                          : {
                              backgroundColor: "transparent",
                              border: `1.5px dashed ${isSelected ? "currentColor" : bloc.visual.bg}`,
                            }
                      }
                    />
                    <span>{bloc.shortName}</span>
                    <span className="font-mono text-[11px] opacity-75">{bloc.seats}</span>
                  </button>
                );
              })}
            </div>

            {mode === "explore" ? (
              <p className="text-center text-[11px] text-ink-muted">
                Pasa el cursor por cualquier área del arco o por un grupo para seleccionarlo; se
                mantiene activo al moverte al panel derecho hasta que pases por otro partido.
              </p>
            ) : null}
          </div>
        </div>

        {/* Columna derecha: Panel Inspector Persistente / Pactómetro */}
        <div className="flex flex-col justify-between rounded-[4px] border border-line bg-surface p-5 sm:p-6">
          {mode === "explore" && selectedBloc ? (
            <div
              key={`panel-${selectedBloc.partyId}`}
              className="flex h-full flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] px-1 text-center text-xs font-extrabold"
                      style={{
                        backgroundColor: selectedBloc.visual.bg,
                        color: selectedBloc.visual.fg,
                      }}
                    >
                      {selectedBloc.shortName.length > 7
                        ? `${selectedBloc.shortName.slice(0, 6)}…`
                        : selectedBloc.shortName}
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold leading-tight text-ink">
                        {selectedBloc.partyName}
                      </h3>
                      <p className="text-xs text-ink-muted">{selectedBloc.territory}</p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-[3px] border border-line bg-canvas px-2.5 py-1 text-xs font-bold text-ink">
                    {selectedBloc.seats} {selectedBloc.seats === 1 ? "escaño" : "escaños"} ·{" "}
                    {sharePct}%
                  </span>
                </div>

                {selectedBloc.published ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-[3px] bg-surface-muted px-2.5 py-1 font-bold text-ink">
                        {selectedBloc.published.publishedCount} medidas publicadas
                      </span>
                      <span className="rounded-[3px] bg-surface-muted px-2.5 py-1 text-ink-secondary">
                        {selectedBloc.published.pageCount} págs. PDF
                      </span>
                    </div>

                    {selectedBloc.published.topThemes.length > 0 ? (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          Bloques con más propuestas
                        </p>
                        {selectedBloc.published.topThemes.slice(0, 3).map((th) => {
                          const w = Math.max(8, Math.round((th.count / maxThemeCount) * 100));
                          return (
                            <Link
                              key={th.id}
                              href={`/programas/${selectedBloc.partyId}#tema-${th.id}`}
                              className="group block space-y-1"
                            >
                              <div className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="truncate font-semibold text-ink group-hover:text-civic group-hover:underline">
                                  {th.title}
                                </span>
                                <span className="shrink-0 font-mono text-ink-muted">
                                  {th.count}
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-surface-muted">
                                <div
                                  className="h-full rounded-[2px] transition-all duration-300"
                                  style={{
                                    width: `${w}%`,
                                    backgroundColor: selectedBloc.visual.bg,
                                  }}
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="inline-flex items-center rounded-[3px] border border-status-pending-border bg-status-pending-bg px-2.5 py-1 text-xs font-semibold text-status-pending-fg">
                      Programa pendiente de publicación (29N)
                    </p>
                    <p className="text-sm leading-relaxed text-ink-secondary">
                      {selectedBloc.pending?.statusNote}
                    </p>
                  </div>
                )}
              </div>

              {selectedBloc.published ? (
                <div className="space-y-2.5 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/programas/${selectedBloc.partyId}`}
                      className={buttonClasses({ variant: "primary", size: "sm" })}
                    >
                      Explorar sus {selectedBloc.published.publishedCount} medidas →
                    </Link>
                    <Link
                      href={compareTargets}
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      Cruzar en el comparador
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <Link
                      href={`/buscar?partido=${encodeURIComponent(selectedBloc.partyId)}`}
                      className="link-draw font-medium text-ink-secondary hover:text-ink"
                    >
                      Buscar dentro de {selectedBloc.shortName}
                    </Link>
                    <a
                      href={selectedBloc.published.pdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-draw font-medium text-ink-secondary hover:text-ink"
                    >
                      PDF oficial ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <Link
                    href={`/programas/${selectedBloc.partyId}`}
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                  >
                    Ver ficha de seguimiento →
                  </Link>
                  {selectedBloc.pending?.website ? (
                    <a
                      href={selectedBloc.pending.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-draw text-xs font-semibold text-civic"
                    >
                      Web oficial ↗
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div
              key="panel-coalition"
              className="animate-panel-switch flex h-full flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Suma de pacto seleccionada
                    </p>
                    <p className="text-2xl font-black text-ink">
                      <span className={hasMajority ? "text-civic" : "text-ink"}>
                        {coalitionSeats}
                      </span>{" "}
                      <span className="text-sm font-semibold text-ink-muted">
                        / {ABSOLUTE_MAJORITY} escaños
                      </span>
                    </p>
                  </div>

                  <span
                    className={`rounded-[3px] border px-2.5 py-1 text-xs font-bold ${
                      hasMajority
                        ? "border-civic bg-civic-subtle text-civic"
                        : "border-line bg-canvas text-ink-secondary"
                    }`}
                  >
                    {hasMajority
                      ? `Mayoría (+${coalitionSeats - ABSOLUTE_MAJORITY})`
                      : `Faltan ${ABSOLUTE_MAJORITY - coalitionSeats}`}
                  </span>
                </div>

                {/* Barra multicolor apilada sobre 350 escaños */}
                <div className="space-y-1.5">
                  <div className="relative flex h-4 w-full overflow-hidden rounded-[3px] border border-line bg-surface-muted">
                    {coalitionBlocs.map((b) => {
                      const pct = (b.seats / TOTAL_CONGRESS_SEATS) * 100;
                      return (
                        <div
                          key={`seg-${b.partyId}`}
                          title={`${b.shortName}: ${b.seats} escaños`}
                          style={{ width: `${pct}%`, backgroundColor: b.visual.bg }}
                          className="h-full border-r border-canvas/40 transition-all duration-300 last:border-r-0"
                        />
                      );
                    })}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink"
                      style={{ left: "50.28%" }}
                      title="Mayoría absoluta: 176 escaños"
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Línea vertical en <strong>176 escaños</strong> (mayoría absoluta de 350).
                  </p>
                </div>

                {/* Presets de acuerdos */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Escenarios rápidos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COALITION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCoalitionIds(preset.ids)}
                        className="rounded-[3px] border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-secondary hover:border-ink hover:text-ink"
                      >
                        {preset.label}
                      </button>
                    ))}
                    {coalitionIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setCoalitionIds([])}
                        className="px-2 py-1 text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
                      >
                        Limpiar
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Socios activos */}
                <div className="flex flex-wrap gap-1.5">
                  {coalitionBlocs.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      Pulsa los bloques del hemiciclo o de las píldoras inferiores para sumarlos.
                    </p>
                  ) : (
                    coalitionBlocs.map((b) => (
                      <button
                        key={`partner-${b.partyId}`}
                        type="button"
                        onClick={() => handleClickBloc(b.partyId)}
                        style={{ borderLeftColor: b.visual.bg }}
                        className="inline-flex items-center gap-1.5 rounded-[3px] border border-l-4 border-line bg-canvas px-2 py-1 text-xs font-semibold text-ink hover:border-ink"
                        title="Pulsa para quitar de la suma"
                      >
                        <span>
                          {b.shortName} ({b.seats})
                        </span>
                        <span aria-hidden="true" className="text-ink-muted">
                          ×
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <Link
                  href={coalitionCompareHref}
                  className={buttonClasses({ variant: "primary", size: "sm" })}
                >
                  {coalitionPublishedIds.length >= 2
                    ? `Comparar programas de estos socios (${coalitionPublishedIds.length}) →`
                    : "Abrir comparador →"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Otras candidaturas del 29N (fuera del Congreso saliente) */}
      {otherEntries.length > 0 ? (
        <div className="space-y-4 border-t border-line pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                Otras candidaturas del 29N con programa oficial ({otherCounts.all})
              </h3>
              <p className="text-sm text-ink-secondary">
                Formaciones sin representación en el Congreso saliente cuyo programa completo ya
                está publicado.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar candidaturas">
              {[
                { id: "all" as const, label: `Todas (${otherCounts.all})` },
                { id: "estatal" as const, label: `Ámbito estatal (${otherCounts.estatal})` },
                {
                  id: "autonomico" as const,
                  label: `Autonómicas y provinciales (${otherCounts.autonomico})`,
                },
              ].map((tab) => {
                const active = otherScopeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setOtherScopeFilter(tab.id)}
                    className={`rounded-[3px] border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-ink bg-ink font-bold text-canvas"
                        : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            key={`${otherScopeFilter}::${showAllOther ? "all" : "compact"}`}
            className="animate-panel-switch grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visibleOtherEntries.map((entry) => {
              const visual = getPartyVisual(entry.partyId);
              const topTheme = entry.topThemes[0];

              return (
                <article
                  key={entry.partyId}
                  style={{ borderLeftColor: visual.bg }}
                  className="editorial-card group relative flex cursor-pointer flex-col justify-between gap-3 rounded-[3px] border border-l-4 border-line bg-surface p-4 shadow-2xs transition-colors hover:border-line-strong"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-base font-extrabold text-ink transition-colors group-hover:text-civic">
                        {entry.shortName}
                      </h4>
                      <span className="shrink-0 text-[11px] font-medium text-ink-muted">
                        {entry.territory}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-ink-secondary">{entry.partyName}</p>
                    {topTheme ? (
                      <p className="text-xs text-ink-muted">
                        Bloque principal:{" "}
                        <strong className="font-semibold text-ink-secondary">
                          {topTheme.title}
                        </strong>{" "}
                        ({topTheme.count})
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs">
                    <span className="font-semibold text-ink">
                      {entry.publishedCount} propuestas · {entry.pageCount} págs.
                    </span>
                    <Link
                      href={`/programas/${entry.partyId}`}
                      className="font-bold text-civic underline-offset-4 before:absolute before:inset-0 before:z-0 before:content-[''] group-hover:underline"
                    >
                      Explorar →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {otherScopeFilter === "all" && otherEntries.length > INITIAL_OTHER_LIMIT ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => runWithViewTransition(() => setShowAllOther((prev) => !prev))}
                className="rounded-[3px] border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-ink"
              >
                {showAllOther
                  ? "Mostrar menos candidaturas ↑"
                  : `Ver las ${otherEntries.length} candidaturas extraparlamentarias (+${otherEntries.length - INITIAL_OTHER_LIMIT} más) ↓`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
