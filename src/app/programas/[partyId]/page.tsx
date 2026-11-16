import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getParties,
  getPartyAnalyticsById,
  getPartyById,
  getProgramByPartyId,
  getPublishedProposalsByParty,
  getSourceDocumentById,
  getSurveyQuestions,
  getThemes,
} from "@/modules/corpus/repository";
import type { LikertScore, PartyId } from "@/modules/corpus/types";
import { ProgramViewer } from "@/modules/programs/ProgramViewer";
import { Badge } from "@/modules/ui/components/Badge";
import { buttonClasses } from "@/modules/ui/components/Button";
import { Callout } from "@/modules/ui/components/Callout";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import {
  getPartyMeta,
  getPartyVisual,
  getPendingCongressParty,
  PENDING_CONGRESS_PARTIES,
} from "@/modules/ui/party-colors";

function stanceShortLabel(value: LikertScore | null): string {
  switch (value) {
    case 2:
      return "Muy a favor";
    case 1:
      return "A favor";
    case 0:
      return "Postura neutra";
    case -1:
      return "En contra";
    case -2:
      return "Muy en contra";
    default:
      return "Postura definida";
  }
}

export async function generateStaticParams() {
  const parties = await getParties();
  return [
    ...parties.map((party) => ({ partyId: party.id })),
    ...PENDING_CONGRESS_PARTIES.map((p) => ({ partyId: p.partyId })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partyId: string }>;
}): Promise<Metadata> {
  const { partyId } = await params;
  const party = await getPartyById(partyId);
  if (party) {
    return {
      title: `${party.short_name.value ?? party.id} — ${party.name.value ?? ""} | 29N`,
      description: `Programa electoral completo de ${party.name.value ?? party.short_name.value ?? partyId} para el 29N con acceso directo a cada medida y al PDF oficial.`,
    };
  }
  const pending = getPendingCongressParty(partyId);
  if (pending) {
    return {
      title: `${pending.shortName} — Programa pendiente | 29N`,
      description: `Ficha informativa de ${pending.partyName} (Congreso saliente): seguimiento de publicación de su programa electoral del 29N.`,
    };
  }
  return { title: "Programa no encontrado | 29N" };
}

export default async function PartyProgramPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const party = await getPartyById(partyId);

  if (!party) {
    const pending = getPendingCongressParty(partyId);
    if (!pending) {
      notFound();
    }
    const visual = getPartyVisual(pending.partyId);
    return (
      <div className="space-y-8">
        <nav aria-label="Ruta de navegación" className="text-xs text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-civic hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/programas" className="hover:text-civic hover:underline">
                Programas
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-ink">{pending.shortName}</li>
          </ol>
        </nav>

        <header className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="h-1.5 w-full" style={{ backgroundColor: visual.bg }} aria-hidden="true" />
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{ backgroundColor: visual.bg, color: visual.fg }}
                  className="rounded-md px-2.5 py-0.5 text-xs font-bold"
                >
                  {pending.shortName}
                </span>
                <Badge variant="civic">{pending.outgoingCongressSeats} escaños salientes</Badge>
                <Badge variant="neutral">{pending.territory}</Badge>
                <Badge variant="neutral">Programa pendiente de publicación</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {pending.partyName}
              </h1>
              <p className="max-w-2xl text-base text-ink-secondary">
                Ficha informativa de candidatura del Congreso de los Diputados saliente (XV
                Legislatura).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={pending.website}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                Web oficial de la candidatura ↗
              </a>
              <Link
                href="/programas"
                className={buttonClasses({ variant: "secondary", size: "md" })}
              >
                Ver programas publicados
              </Link>
            </div>
          </div>
        </header>

        <Callout title="Programa electoral oficial todavía no publicado" tone="info">
          {pending.statusNote} Para evitar cualquier dato inventado o atribución aproximada, sus
          propuestas y su posición en el comparador y en el test de afinidad permanecerán vacías
          hasta que el partido publique su programa completo.
        </Callout>
      </div>
    );
  }

  const [program, themes, publishedProposals, analytics, questions] = await Promise.all([
    getProgramByPartyId(partyId),
    getThemes(),
    getPublishedProposalsByParty(partyId as PartyId),
    getPartyAnalyticsById(partyId),
    getSurveyQuestions(),
  ]);

  const sourceDoc = program ? await getSourceDocumentById(program.source_document_id) : null;

  const partyName = party.name.value ?? partyId;
  const shortName = party.short_name.value ?? partyId.toUpperCase();
  const visual = getPartyVisual(partyId);
  const meta = getPartyMeta(partyId);

  const allThemesDist = analytics?.themeDistribution ?? [];
  const maxThemeCount = allThemesDist[0]?.count ?? 1;

  const proposalMapById = new Map(publishedProposals.map((p) => [p.id, p]));

  const headlineStances = questions
    .map((q) => {
      const pos = q.positions[partyId as PartyId];
      if (!pos || pos.status !== "posicion" || pos.value === null) return null;
      const primaryId = pos.evidence_proposal_ids[0] ?? null;
      const cited = primaryId ? proposalMapById.get(primaryId) : undefined;
      return {
        id: q.id,
        statement: q.statement,
        value: pos.value,
        rationale: pos.rationale,
        primaryProposalId: primaryId,
        pdfHref: cited?.evidence[0]?.pdf_href ?? null,
        page: cited?.evidence[0]?.pages[0] ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6);

  const primaryDist = allThemesDist.slice(0, 8);
  const extraDist = allThemesDist.slice(8);
  const compactStances = headlineStances.slice(0, 4);

  return (
    <div className="space-y-10">
      <nav aria-label="Ruta de navegación" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/programas" className="underline underline-offset-4 hover:text-ink">
              Programas
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="font-medium text-ink">{shortName}</li>
        </ol>
      </nav>

      {/* Cabecera del partido */}
      <header style={{ borderLeftColor: visual.bg }} className="entra border-l-4 pl-5 sm:pl-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider text-ink-muted">
                {shortName}
              </span>
              {meta.outgoingCongressSeats !== null ? (
                <Badge variant="civic">{meta.outgoingCongressSeats} escaños salientes</Badge>
              ) : null}
              {meta.scope === "autonomico" ? (
                <Badge variant="neutral">{meta.territory}</Badge>
              ) : null}
              {program?.languages.includes("gl") ? <Badge variant="neutral">Galego</Badge> : null}
              {program?.languages.includes("ca") ? (
                <Badge variant="neutral">Català / Valencià</Badge>
              ) : null}
            </div>

            <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-5xl">
              {partyName}
            </h1>

            <p className="max-w-3xl text-base text-ink-secondary">
              {program?.title.value ?? `Programa electoral 29N — ${shortName}`}
              {analytics ? (
                <span className="text-ink-muted">
                  {" "}
                  · {analytics.proposalCount} propuestas
                  {program && program.stats.reserved > 0
                    ? ` (de ${program.stats.extracted} numeradas en el PDF, ${program.stats.reserved} reservadas en campaña)`
                    : ""}{" "}
                  · {sourceDoc?.page_count ?? "—"} páginas · lectura estimada ~
                  {analytics.readingLabel}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {sourceDoc ? (
              <a
                href={`/pdfs/${sourceDoc.id}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[3px] border border-ink bg-ink px-4 py-2 text-xs font-bold text-canvas transition-colors hover:bg-transparent hover:text-ink"
              >
                PDF oficial completo ↗
              </a>
            ) : null}
            <Link
              href={`/comparar?partidos=${encodeURIComponent(partyId)},psoe,pp`}
              className="rounded-[3px] border border-line-strong bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-ink"
            >
              Comparar con otros partidos →
            </Link>
          </div>
        </div>
      </header>

      {/* Panel equilibrado de síntesis antes de las medidas: 2 columnas */}
      {analytics || compactStances.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 border-t border-line pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          {analytics ? (
            <section aria-labelledby="distribucion-heading" className="space-y-4">
              <div>
                <h2
                  id="distribucion-heading"
                  className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
                >
                  Peso de cada bloque en su programa
                </h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Los bloques con mayor número de medidas ({analytics.proposalCount} en total).
                  Pulsa uno para abrir ese bloque abajo.
                </p>
              </div>

              {(() => {
                const renderThemeRow = (
                  item: (typeof primaryDist)[number],
                  idx: number,
                  animateBar: boolean,
                ) => {
                  const widthPct = Math.max(4, Math.round((item.count / maxThemeCount) * 100));
                  return (
                    <a
                      key={item.themeId}
                      href={`#tema-${item.themeId}`}
                      className="group grid grid-cols-[minmax(8.5rem,14rem)_1fr_3rem] items-center gap-3 text-xs sm:text-sm"
                    >
                      <span className="truncate font-semibold text-ink transition-colors group-hover:text-civic group-hover:underline">
                        {item.title}
                      </span>
                      <span className="h-2.5 w-full overflow-hidden rounded-[2px] bg-surface-muted">
                        <span
                          className={
                            animateBar
                              ? "bar-grow block h-full rounded-[2px]"
                              : "block h-full rounded-[2px]"
                          }
                          style={
                            {
                              width: `${widthPct}%`,
                              backgroundColor: visual.bg,
                              ...(animateBar ? { "--bar-delay": `${idx * 35}ms` } : {}),
                            } as CSSProperties
                          }
                        />
                      </span>
                      <span className="text-right font-mono text-xs text-ink-muted">
                        {item.count}
                      </span>
                    </a>
                  );
                };

                return (
                  <div className="space-y-2.5 pt-1">
                    <ScrollReveal className="space-y-2.5">
                      {primaryDist.map((item, idx) => renderThemeRow(item, idx, true))}
                    </ScrollReveal>

                    {extraDist.length > 0 ? (
                      <details className="group flex flex-col [&::details-content]:order-1">
                        <summary className="order-2 mt-1 inline-flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-[3px] border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-line-strong hover:text-civic [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">
                            Ver los {extraDist.length} bloques restantes ↓
                          </span>
                          <span className="hidden group-open:inline">
                            Ocultar bloques restantes ↑
                          </span>
                        </summary>
                        <div className="fade-lift-in space-y-2.5 pb-2.5">
                          {extraDist.map((item, idx) => renderThemeRow(item, idx, false))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                );
              })()}
            </section>
          ) : null}

          <div className="space-y-8">
            {compactStances.length > 0 ? (
              <section aria-labelledby="ideas-principales-heading" className="space-y-3.5">
                <div>
                  <h2
                    id="ideas-principales-heading"
                    className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
                  >
                    Posturas en debates clave
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    Síntesis en 4 cuestiones centrales enlazadas a su cita.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {compactStances.map((item) => (
                    <article
                      key={item.id}
                      style={{ borderLeftColor: visual.bg }}
                      className="rounded-[3px] border border-l-4 border-line bg-surface p-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-[3px] border border-line bg-surface-muted px-2 py-0.5 text-[11px] font-bold text-ink">
                          {stanceShortLabel(item.value)}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          {item.primaryProposalId ? (
                            <a
                              href={`#medida-${item.primaryProposalId}`}
                              className="font-bold text-civic hover:underline"
                            >
                              Ver cita ↓
                            </a>
                          ) : null}
                          {item.pdfHref && item.page ? (
                            <a
                              href={item.pdfHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-muted hover:text-ink hover:underline"
                            >
                              Pág. {item.page} ↗
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold leading-snug text-ink">
                        {item.statement}
                      </h3>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {analytics && analytics.distinctiveTerms.length > 0 ? (
              <section aria-labelledby="palabras-distintivas-heading" className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2
                    id="palabras-distintivas-heading"
                    className="text-lg font-extrabold tracking-tight text-ink"
                  >
                    Vocabulario más característico
                  </h2>
                  <Link href="/estadisticas" className="link-draw text-xs font-semibold text-civic">
                    Comparar vocabulario →
                  </Link>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {analytics.distinctiveTerms.slice(0, 10).map((termObj) => (
                    <Link
                      key={termObj.term}
                      href={`/buscar?partido=${encodeURIComponent(partyId)}&q=${encodeURIComponent(termObj.term)}`}
                      className="rounded-[3px] border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-ink hover:text-ink"
                      title={`${termObj.count} apariciones en el programa de ${shortName}`}
                    >
                      {termObj.term}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-line pt-8">
        <ProgramViewer
          partyName={partyName}
          shortName={shortName}
          accentColor={visual.bg}
          themes={themes}
          publishedProposals={publishedProposals}
        />
      </div>
    </div>
  );
}
