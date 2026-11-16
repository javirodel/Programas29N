import type { Metadata } from "next";
import Link from "next/link";
import { loadCoverageReport } from "@/modules/corpus/repository";
import { buttonClasses } from "@/modules/ui/components/Button";
import { Callout } from "@/modules/ui/components/Callout";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";
import { getPartyVisual, PENDING_CONGRESS_PARTIES } from "@/modules/ui/party-colors";

export const metadata: Metadata = {
  title: "Cómo funciona y Metodología | 29N",
  description:
    "Criterios de inclusión de candidaturas del 29N, fidelidad íntegra a los programas oficiales en PDF, funcionamiento de «A favor y en contra» y cálculo neutral del test de afinidad.",
};

export default async function MetodologiaPage() {
  const report = await loadCoverageReport();
  const totalPrograms = report.totals.parties;

  return (
    <div className="space-y-12">
      <header className="space-y-3 border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Transparencia y fuentes oficiales
        </p>
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Cómo funciona 29N · Fuentes y metodología
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary">
          Esta plataforma reúne los {totalPrograms} programas electorales oficiales publicados en
          PDF para las elecciones generales del 29 de noviembre, junto con el seguimiento de las
          formaciones presentes en el Congreso saliente cuyo documento completo sigue pendiente de
          publicación.
        </p>
      </header>

      <section
        aria-labelledby="pilares-heading"
        className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-4"
      >
        <ScrollReveal as="article" delayMs={0} className="space-y-2 border-t border-line pt-4">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">01</span>
          <h2 id="pilares-heading" className="text-base font-extrabold text-ink">
            Criterio de inclusión
          </h2>
          <p className="text-xs leading-relaxed text-ink-secondary">
            Tienen cabida todas las candidaturas que hayan publicado programa electoral oficial para
            el 29N, además de todos los partidos del Congreso de los Diputados saliente (XV
            Legislatura), indicando con claridad cuáles mantienen su documento pendiente.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={60} className="space-y-2 border-t border-line pt-4">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">02</span>
          <h2 className="text-base font-extrabold text-ink">Literalidad e integridad PDF</h2>
          <p className="text-xs leading-relaxed text-ink-secondary">
            Los {totalPrograms} programas se enlazan directamente al PDF oficial original y
            mantienen su redacción literal (incluidas las lenguas cooficiales), identificados
            mediante huella criptográfica SHA-256.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={120} className="space-y-2 border-t border-line pt-4">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">03</span>
          <h2 className="text-base font-extrabold text-ink">«A favor y en contra»</h2>
          <p className="text-xs leading-relaxed text-ink-secondary">
            Cada propuesta incorpora un desplegable colapsado por defecto con una explicación llana,
            argumentos favorables y posibles objeciones técnicas, fiscales o jurídicas, separado del
            texto oficial del partido.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={180} className="space-y-2 border-t border-line pt-4">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">04</span>
          <h2 className="text-base font-extrabold text-ink">Sin sesgo ante el silencio</h2>
          <p className="text-xs leading-relaxed text-ink-secondary">
            Nunca se inventan propuestas ni posturas. Si un programa no aborda una cuestión o su
            texto no permite inferir una posición nítida, figura explícitamente como{" "}
            <span className="font-semibold text-ink">Sin referencia</span> o{" "}
            <span className="font-semibold text-ink">Insuficiente</span>.
          </p>
        </ScrollReveal>
      </section>

      <section aria-labelledby="cobertura-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cobertura-heading" className="text-2xl font-bold text-ink">
              Programas oficiales incluidos ({totalPrograms})
            </h2>
            <p className="text-sm text-ink-secondary">
              Total actual: {report.totals.published.toLocaleString("es-ES")} medidas publicadas en{" "}
              {totalPrograms} candidaturas con documento oficial disponible.
            </p>
          </div>
          <Link href="/programas" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Explorar catálogo completo
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-xs">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Resumen de documentos oficiales, medidas y huellas SHA-256 por candidatura
            </caption>
            <thead className="bg-surface-muted text-ink-muted">
              <tr className="border-b border-line">
                <th scope="col" className="p-3 font-semibold">
                  Candidatura
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Págs. PDF
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Medidas publicadas
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Documento PDF oficial (SHA-256)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-secondary">
              {report.by_party.map((row) => (
                <tr key={row.party_id}>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    <Link
                      href={`/programas/${row.party_id}`}
                      className="text-civic hover:underline"
                    >
                      {row.short_name}
                    </Link>{" "}
                    <span className="font-normal text-ink-muted">· {row.party_name}</span>
                  </th>
                  <td className="p-3">{row.page_count}</td>
                  <td className="p-3 font-semibold text-ink">
                    {row.published}
                    {row.reserved > 0 ? (
                      <span className="ml-1 font-normal text-ink-muted">
                        ({row.extracted} en PDF, {row.reserved} reservadas)
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 font-mono" title={row.sha256}>
                    <a
                      href={`/pdfs/${row.document_id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-civic hover:underline"
                    >
                      {row.sha256.slice(0, 16)}…
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="congreso-pendiente-heading" className="space-y-4">
        <div>
          <h2 id="congreso-pendiente-heading" className="text-2xl font-bold text-ink">
            Congreso saliente pendiente de publicar programa ({PENDING_CONGRESS_PARTIES.length})
          </h2>
          <p className="text-sm text-ink-secondary">
            Las siguientes formaciones cuentan con escaños en el Congreso de los Diputados saliente
            (XV Legislatura), pero aún no han publicado su documento programático en PDF para las
            elecciones del 29N. Sus fichas informativas están abiertas y se ampliarán con sus
            medidas en cuanto publiquen el documento oficial.
          </p>
        </div>
        <ScrollReveal className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PENDING_CONGRESS_PARTIES.map((p) => {
            const visual = getPartyVisual(p.partyId);
            return (
              <div
                key={p.partyId}
                style={{ borderLeftColor: visual.bg }}
                className="editorial-card space-y-2 rounded-[3px] border border-l-4 border-line bg-surface p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/programas/${p.partyId}`}
                    className="link-draw text-sm font-extrabold text-civic"
                  >
                    {p.shortName}
                  </Link>
                  <span className="font-mono text-xs font-semibold text-ink-muted">
                    {p.outgoingCongressSeats} escaños salientes
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">{p.territory}</p>
              </div>
            );
          })}
        </ScrollReveal>
      </section>

      <Callout title="Fórmula de afinidad del test ciudadano" tone="info">
        Para cada candidatura, el porcentaje de afinidad se calcula únicamente sobre el subconjunto
        de preguntas respondidas numéricamente por el usuario en las que el programa ofrece una
        posición explícita:{" "}
        <span className="font-mono">afinidad = (100 / |Q|) * Σ (1 - |u_i - a_i| / 4)</span>. La
        ausencia de postura en el programa nunca suma ni resta puntos ni se interpreta como
        oposición.
      </Callout>

      <section aria-labelledby="hemiciclo-metodologia-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="hemiciclo-metodologia-heading" className="text-2xl font-bold text-ink">
            Criterios del hemiciclo y Pactómetro (2023 vs. Estimación 29N)
          </h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            El mapa interactivo de la portada permite alternar tanto en <em>Explorar partidos</em>{" "}
            como en el <em>Pactómetro</em> entre dos composiciones distintas de los 350 escaños del
            Congreso de los Diputados:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-[4px] border border-line bg-surface p-5">
            <h3 className="text-base font-extrabold text-ink">
              Elecciones generales 2023 (Congreso saliente)
            </h3>
            <p className="text-xs leading-relaxed text-ink-secondary">
              Recoge el reparto real de los 350 escaños resultante de las elecciones generales de
              julio de 2023 (XV Legislatura), reflejando la distribución vigente al cierre de la
              legislatura: PP (137), PSOE (121), Vox (33), Sumar/Frente Amplio (25), ERC (7), Junts
              (7), EH Bildu (6), EAJ-PNV (5), Podemos (4), Compromís (2), BNG (1), Coalición Canaria
              (1) y UPN (1).
            </p>
          </div>

          <div className="space-y-2 rounded-[4px] border border-line bg-surface p-5">
            <h3 className="text-base font-extrabold text-ink">
              Estimación 29N (Media de 5 encuestas · nov. 2026)
            </h3>
            <p className="text-xs leading-relaxed text-ink-secondary">
              Elaborada a partir de la mezcla y promedio de las 5 principales encuestas de ámbito
              nacional publicadas al inicio de la campaña de noviembre de 2026 (
              <strong>40dB / El País</strong>, <strong>Sigma Dos / El Mundo</strong>,{" "}
              <strong>SocioMétrica / El Español</strong>, <strong>GAD3 / ABC</strong> y{" "}
              <strong>CIS</strong>), contrastada con el agregador <strong>DatosRTVE</strong>. Solo
              entran en el hemiciclo y en el Pactómetro 2026 las candidaturas con proyección de
              escaños: PP (131), PSOE (110), Vox (65), Frente Amplio (11), ERC (9), EH Bildu (7),
              Junts (5), EAJ-PNV (4), BNG (2), UPN (2), Compromís (2), Podemos (1) y CCa (1).
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          Nota metodológica: las proyecciones demoscópicas son estrictamente orientativas, están
          sujetas a error muestral y nunca alteran ni condicionan las medidas verificadas del corpus
          documental (N0–N4).
        </p>
      </section>
    </div>
  );
}
