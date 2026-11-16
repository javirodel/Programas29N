"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PartyProgramAnalytics } from "@/modules/corpus/stats";
import { cn } from "@/modules/ui/cn";
import { Badge } from "@/modules/ui/components/Badge";
import { Card } from "@/modules/ui/components/Card";
import {
  getPartyVisual,
  isPartyInProvince,
  PENDING_CONGRESS_PARTIES,
  SPANISH_PROVINCES,
} from "@/modules/ui/party-colors";
import type { CatalogEntry } from "./view-model";

type SortMode = "alphabetical" | "proposals_desc" | "pages_desc" | "seats_desc";
type FilterTab = "all" | "congress" | "estatal" | "autonomico";

function formatLanguageLabel(lang: string): string {
  switch (lang) {
    case "gl":
      return "Galego";
    case "ca":
      return "Català / Valencià";
    default:
      return lang.toUpperCase();
  }
}

export function ProgramCatalog({
  entries,
  analyticsByParty = {},
}: {
  entries: CatalogEntry[];
  analyticsByParty?: Record<string, PartyProgramAnalytics>;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("seats_desc");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [activePartyAnchor, setActivePartyAnchor] = useState<string>("");
  const navRailRef = useRef<HTMLDivElement | null>(null);

  const tabCounts = useMemo(() => {
    const publishedCongress = entries.filter((e) => e.outgoingCongressSeats !== null).length;
    return {
      all: entries.length,
      congress: publishedCongress + PENDING_CONGRESS_PARTIES.length,
      estatal: entries.filter((e) => e.scope === "estatal").length,
      autonomico: entries.filter((e) => e.scope === "autonomico").length,
    };
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((entry) => {
      if (filterTab === "congress" && entry.outgoingCongressSeats === null) return false;
      if (filterTab === "estatal" && entry.scope !== "estatal") return false;
      if (filterTab === "autonomico" && entry.scope !== "autonomico") return false;
      if (provinceFilter !== "all" && !isPartyInProvince(entry.partyId, provinceFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        entry.partyName.toLowerCase().includes(q) ||
        entry.shortName.toLowerCase().includes(q) ||
        entry.programTitle.toLowerCase().includes(q) ||
        entry.territory.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "proposals_desc":
          return b.publishedCount - a.publishedCount;
        case "pages_desc":
          return b.pageCount - a.pageCount;
        case "seats_desc":
          return (
            (b.outgoingCongressSeats ?? 0) - (a.outgoingCongressSeats ?? 0) ||
            a.partyName.localeCompare(b.partyName, "es")
          );
        case "alphabetical":
        default:
          return a.partyName.localeCompare(b.partyName, "es");
      }
    });
  }, [entries, query, sortBy, filterTab, provinceFilter]);

  const filteredPending = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PENDING_CONGRESS_PARTIES.filter((p) => {
      if (filterTab === "estatal" && p.scope !== "estatal") return false;
      if (filterTab === "autonomico" && p.scope !== "autonomico") return false;
      if (provinceFilter !== "all" && !isPartyInProvince(p.partyId, provinceFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        p.partyName.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        p.territory.toLowerCase().includes(q)
      );
    });
  }, [query, filterTab, provinceFilter]);

  // Scrollspy sobre tarjetas de partidos
  useEffect(() => {
    const ids = [...filtered.map((e) => e.partyId), ...filteredPending.map((p) => p.partyId)];
    const elements = ids
      .map((id) => document.getElementById(`partido-${id}`))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (obsEntries) => {
        const visible = obsEntries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (!first) return;
        setActivePartyAnchor(first.target.id.replace(/^partido-/, ""));
      },
      { rootMargin: "-150px 0px -65% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [filtered, filteredPending]);

  // Centrar píldora activa únicamente en el carril horizontal sin mover el scroll de ventana
  useEffect(() => {
    const rail = navRailRef.current;
    if (!activePartyAnchor || !rail) return;
    const pill = rail.querySelector<HTMLElement>(`[data-party-pill="${activePartyAnchor}"]`);
    if (!pill) return;
    const left = pill.offsetLeft - rail.clientWidth / 2 + pill.offsetWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activePartyAnchor]);

  return (
    <section aria-label="Directorio de candidaturas" className="sticky-topic-parent space-y-6">
      {/* Barra de ámbito y búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por ámbito">
          {[
            { id: "all" as const, label: `Todos con programa (${tabCounts.all})` },
            { id: "congress" as const, label: `Congreso saliente (${tabCounts.congress})` },
            { id: "estatal" as const, label: `Ámbito estatal (${tabCounts.estatal})` },
            { id: "autonomico" as const, label: `Autonómicos (${tabCounts.autonomico})` },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  "rounded-[3px] border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-ink bg-ink text-canvas font-bold"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="catalog-province" className="sr-only">
            Filtrar por provincia o circunscripción
          </label>
          <select
            id="catalog-province"
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="rounded-[3px] border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink"
          >
            <option value="all">Todas las provincias</option>
            {SPANISH_PROVINCES.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.label} ({prov.community})
              </option>
            ))}
          </select>

          <label htmlFor="catalog-filter" className="sr-only">
            Filtrar partido o territorio
          </label>
          <input
            id="catalog-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar partido o territorio…"
            className="w-44 rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted sm:w-48"
          />

          <label htmlFor="catalog-sort" className="sr-only">
            Ordenar por
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="rounded-[3px] border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink"
          >
            <option value="seats_desc">Escaños Congreso</option>
            <option value="alphabetical">Nombre (A–Z)</option>
            <option value="proposals_desc">Más medidas</option>
            <option value="pages_desc">Más páginas</option>
          </select>
        </div>
      </div>

      {provinceFilter !== "all" ? (
        <p className="rounded-[3px] border border-line bg-surface-muted/60 px-3.5 py-2 text-xs text-ink-secondary">
          Mostrando candidaturas de ámbito estatal y territorial correspondientes a{" "}
          <strong className="text-ink">
            {SPANISH_PROVINCES.find((p) => p.id === provinceFilter)?.label}
          </strong>
          . Las candidaturas extraparlamentarias estatales pueden no concurrir en todas las
          provincias tras la proclamación oficial de listas.
        </p>
      ) : null}

      {/* Barra sticky horizontal con borde superior del color del partido + Scrollspy */}
      <nav
        aria-label="Ir a un partido"
        className="sticky top-14 z-20 -mx-4 border-y border-line bg-canvas/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <div ref={navRailRef} className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {filtered.map((item) => {
            const visual = getPartyVisual(item.partyId);
            const active = activePartyAnchor === item.partyId;
            return (
              <a
                key={`pill-${item.partyId}`}
                href={`#partido-${item.partyId}`}
                data-party-pill={item.partyId}
                aria-current={active ? "true" : "false"}
                style={{ borderTopColor: visual.bg }}
                className={cn(
                  "shrink-0 rounded-[3px] border border-t-4 px-3 py-1 text-xs font-bold transition-colors",
                  active
                    ? "border-x-ink border-b-ink bg-ink text-canvas"
                    : "border-x-line border-b-line bg-surface text-ink hover:border-x-line-strong",
                )}
              >
                {item.shortName}
              </a>
            );
          })}
          {filteredPending.map((pending) => {
            const visual = getPartyVisual(pending.partyId);
            const active = activePartyAnchor === pending.partyId;
            return (
              <a
                key={`pill-${pending.partyId}`}
                href={`#partido-${pending.partyId}`}
                data-party-pill={pending.partyId}
                aria-current={active ? "true" : "false"}
                style={{ borderTopColor: visual.bg }}
                className={cn(
                  "shrink-0 rounded-[3px] border border-t-4 px-3 py-1 text-xs font-medium opacity-80 transition-colors",
                  active
                    ? "border-x-ink border-b-ink bg-ink font-bold text-canvas opacity-100"
                    : "border-x-line border-b-line bg-surface text-ink-secondary hover:opacity-100",
                )}
              >
                {pending.shortName}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Rejilla editorial compacta en 2 columnas */}
      {filtered.length === 0 ? (
        <Card className="text-center text-sm text-ink-secondary">
          No hay ninguna candidatura con programa publicado que coincida con el filtro actual.
        </Card>
      ) : (
        <div
          key={`${filterTab}::${sortBy}::${query.trim().toLowerCase()}`}
          className="animate-panel-switch grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {filtered.map((item, idx) => {
            const visual = getPartyVisual(item.partyId);
            const analytics = analyticsByParty[item.partyId];
            const topThreeThemes =
              analytics?.themeDistribution.slice(0, 3) ??
              item.topThemes
                .slice(0, 3)
                .map((t) => ({ themeId: t.id, title: t.title, count: t.count }));
            const topTerms = analytics?.distinctiveTerms.slice(0, 3) ?? [];

            return (
              <article
                key={item.partyId}
                id={`partido-${item.partyId}`}
                style={
                  {
                    borderLeftColor: visual.bg,
                    "--d": `${Math.min(idx, 10) * 35}ms`,
                  } as CSSProperties
                }
                className="entra editorial-card group relative flex scroll-mt-36 cursor-pointer flex-col justify-between gap-4 rounded-[3px] border border-l-4 border-line bg-surface p-5 shadow-2xs transition-colors hover:border-line-strong"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold tracking-tight text-ink transition-colors group-hover:text-civic">
                          {item.shortName}
                        </h2>
                        {item.outgoingCongressSeats !== null ? (
                          <Badge variant="civic">{item.outgoingCongressSeats} escaños</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs font-medium text-ink-secondary">{item.partyName}</p>
                    </div>

                    <div className="text-right text-[11px] text-ink-muted">
                      <span
                        className={cn(
                          "inline-block rounded-[2px] border px-2 py-0.5 font-semibold",
                          item.scope === "estatal"
                            ? "border-line bg-canvas text-ink-secondary"
                            : "border-civic/30 bg-civic-subtle/60 text-civic",
                        )}
                      >
                        {item.scope === "estatal"
                          ? "Ámbito estatal"
                          : `Territorial · ${item.territory}`}
                      </span>
                      {item.languages
                        .filter((lang) => lang !== "es")
                        .map((lang) => (
                          <span key={lang} className="mt-1 block">
                            {formatLanguageLabel(lang)}
                          </span>
                        ))}
                    </div>
                  </div>

                  {topThreeThemes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {topThreeThemes.map((th) => (
                        <Link
                          key={th.themeId}
                          href={`/programas/${item.partyId}#tema-${th.themeId}`}
                          className="relative z-10 rounded-[3px] border border-line bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-secondary transition-colors hover:border-ink hover:text-ink"
                        >
                          {th.title} ({th.count})
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {topTerms.length > 0 ? (
                    <p className="text-xs text-ink-muted">
                      <span>Destacan: </span>
                      {topTerms.map((termObj, tIdx) => (
                        <span key={termObj.term}>
                          <Link
                            href={`/buscar?partido=${encodeURIComponent(item.partyId)}&q=${encodeURIComponent(termObj.term)}`}
                            className="relative z-10 font-semibold text-ink hover:text-civic hover:underline"
                          >
                            {termObj.term}
                          </Link>
                          {tIdx < topTerms.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                  <span className="font-semibold text-ink">
                    {item.publishedCount} propuestas · {item.pageCount} págs.
                  </span>

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/programas/${item.partyId}`}
                      className="font-bold text-ink underline-offset-4 transition-colors before:absolute before:inset-0 before:z-0 before:content-[''] group-hover:text-civic group-hover:underline hover:text-civic"
                    >
                      Ver programa →
                    </Link>

                    <a
                      href={item.pdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-draw relative z-10 text-ink-secondary hover:text-ink"
                    >
                      PDF ↗
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Congreso saliente pendiente */}
      {filteredPending.length > 0 ? (
        <div className="space-y-4 border-t border-line pt-8">
          <div>
            <h2 className="text-xl font-extrabold text-ink">
              Congreso saliente pendiente de publicar programa ({filteredPending.length})
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Formaciones con representación en el Congreso de los Diputados (XV Legislatura) que
              todavía no han publicado un documento programático completo para el 29N.
            </p>
          </div>

          <div className="space-y-3">
            {filteredPending.map((pending) => {
              const visual = getPartyVisual(pending.partyId);
              return (
                <article
                  key={pending.partyId}
                  id={`partido-${pending.partyId}`}
                  style={{ borderLeftColor: visual.bg }}
                  className="group relative scroll-mt-36 cursor-pointer rounded-[3px] border border-l-4 border-dashed border-line bg-surface/80 p-5 transition-colors hover:border-line-strong"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
                    <div className="shrink-0 space-y-1 md:w-56">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-ink transition-colors group-hover:text-civic">
                          {pending.shortName}
                        </h3>
                        <Badge variant="civic">{pending.outgoingCongressSeats} escaños</Badge>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {pending.partyName} · {pending.territory}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-ink-secondary">
                        Aún no ha publicado su programa completo para el 29 de noviembre.
                      </p>
                      <div className="flex shrink-0 items-center gap-4 text-xs">
                        <Link
                          href={`/programas/${pending.partyId}`}
                          className="font-semibold text-ink underline underline-offset-4 before:absolute before:inset-0 before:z-0 before:content-[''] group-hover:text-civic hover:text-civic"
                        >
                          Ver ficha
                        </Link>
                        <a
                          href={pending.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-10 text-ink-secondary underline underline-offset-4 hover:text-ink"
                        >
                          Web oficial ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
