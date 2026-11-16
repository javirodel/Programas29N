import type { Metadata } from "next";
import Link from "next/link";
import { loadCoverageReport } from "@/modules/corpus/repository";
import { buttonClasses } from "@/modules/ui/components/Button";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Aviso legal, licencias y respaldo | 29N",
  description:
    "Condiciones de uso, licencias de código y textos oficiales, seguridad técnica y respaldo criptográfico SHA-256 de los 20 programas del 29N.",
};

export default async function AvisoLegalPage() {
  const report = await loadCoverageReport();
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(new Date(report.generated_at));

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="space-y-3 border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Transparencia, licencias y custodia
        </p>
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Aviso legal, licencias y respaldo documental
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary">
          Información sobre la naturaleza cívica de la plataforma, la titularidad de los documentos
          oficiales publicados, las garantías técnicas de seguridad y las copias de respaldo
          verificables mediante huella SHA-256.
        </p>
      </header>

      <section
        aria-labelledby="marco-legal-heading"
        className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2"
      >
        <ScrollReveal as="article" delayMs={0} className="space-y-2.5 border-t border-line pt-5">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">01</span>
          <h2 id="marco-legal-heading" className="text-lg font-extrabold tracking-tight text-ink">
            Neutralidad e independencia editorial
          </h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            <strong>29N · Programas Electorales</strong> es una herramienta informativa
            independiente sin afiliación orgánica, financiera ni electoral con ninguna formación
            política. Su único propósito es facilitar la lectura comparada de los documentos
            oficiales ante las elecciones generales del 29 de noviembre.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={60} className="space-y-2.5 border-t border-line pt-5">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">02</span>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            Titularidad de los programas y licencia del código
          </h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            El código fuente de esta aplicación web se distribuye bajo licencia <strong>MIT</strong>
            . Los programas electorales completos en PDF y la redacción literal de sus propuestas
            son obra y titularidad de cada candidatura, reproducidos aquí con atribución directa y
            enlace al documento oficial.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={120} className="space-y-2.5 border-t border-line pt-5">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">03</span>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            Alcance del análisis contextual («A favor y en contra»)
          </h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Los desplegables colapsados de síntesis y argumentos («A favor y en contra») ofrecen
            contexto divulgativo separado del texto literal oficial. No constituyen asesoramiento
            jurídico, económico ni recomendación de voto; la referencia vinculante es siempre el PDF
            oficial de cada partido.
          </p>
        </ScrollReveal>

        <ScrollReveal as="article" delayMs={180} className="space-y-2.5 border-t border-line pt-5">
          <span className="font-mono text-xs font-bold tracking-wider text-civic">04</span>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            Seguridad de entrega y cabeceras HTTP
          </h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            La aplicación sirve sus vistas estáticas y documentos bajo políticas estrictas de
            seguridad (<code className="rounded bg-surface-muted px-1 py-0.5 text-xs">HSTS</code>,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
              X-Content-Type-Options: nosniff
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
              X-Frame-Options: SAMEORIGIN
            </code>{" "}
            y validación estricta de rutas en la entrega de PDFs).
          </p>
        </ScrollReveal>
      </section>

      {/* Apartado de Respaldo e Integridad SHA-256 */}
      <ScrollReveal
        as="section"
        id="respaldo"
        aria-labelledby="respaldo-heading"
        className="scroll-mt-24 space-y-5"
      >
        <div className="flex flex-col gap-4 rounded-[3px] border border-line bg-surface p-6 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h2 id="respaldo-heading" className="text-xl font-bold text-ink sm:text-2xl">
              Respaldo e integridad criptográfica ({report.totals.parties} documentos)
            </h2>
            <p className="max-w-2xl text-sm text-ink-secondary">
              Cada PDF oficial se conserva íntegramente en la aplicación y queda sellado mediante su
              hash <strong>SHA-256</strong>. Última verificación del corpus:{" "}
              <strong className="text-ink">{formattedDate}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/api/audit"
              download="respaldo_auditoria_29N.json"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Descargar respaldo JSON (SHA-256)
            </a>
            <Link
              href="/metodologia"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Ver metodología
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[3px] border border-line bg-surface shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Manifiesto de respaldo e integridad SHA-256 de los programas publicados
            </caption>
            <thead className="border-b border-line bg-surface-muted text-ink-muted">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Candidatura
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Medidas
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Págs.
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Huella SHA-256 verificada
                </th>
                <th scope="col" className="p-3 text-right font-semibold">
                  Copia PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.by_party.map((row) => (
                <tr key={row.party_id} className="transition-colors hover:bg-surface-muted/40">
                  <td className="p-3 font-semibold text-ink">
                    <Link
                      href={`/programas/${row.party_id}`}
                      className="link-draw hover:text-civic"
                    >
                      {row.party_name}
                    </Link>
                  </td>
                  <td className="p-3 text-ink-secondary">
                    {row.published}
                    {row.reserved > 0
                      ? ` (${row.extracted} en PDF, ${row.reserved} reservadas)`
                      : ""}
                  </td>
                  <td className="p-3 text-ink-secondary">{row.page_count}</td>
                  <td className="p-3 font-mono text-[11px] text-ink-muted">{row.sha256}</td>
                  <td className="p-3 text-right">
                    <a
                      href={`/pdfs/${row.document_id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-draw font-semibold text-civic"
                    >
                      PDF ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </div>
  );
}
