import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/modules/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contacto y sugerencias | 29N",
  description:
    "Envía sugerencias, críticas constructivas, correcciones de citas o avisos sobre nuevos programas electorales para Programa29N.",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-civic">
          Colaboración y mejora continua
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Contacto, sugerencias y correcciones
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink-secondary">
          Programa29N es un proyecto cívico independiente. Si detectas una errata, una cita con
          página desajustada, un partido que acaba de publicar su programa o cualquier mejora en la
          web, puedes escribirnos directamente desde aquí.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_1fr]">
        <ContactForm />

        <aside className="space-y-5">
          <div className="space-y-3 rounded-[4px] border border-line bg-surface p-5">
            <h2 className="text-base font-extrabold text-ink">¿Qué nos ayuda más?</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-ink-secondary">
              <li>
                <strong className="text-ink">Programas recién publicados:</strong> enlace al PDF
                oficial de cualquier candidatura pendiente.
              </li>
              <li>
                <strong className="text-ink">Corrección documental:</strong> número de medida o
                página del PDF que deba revisarse.
              </li>
              <li>
                <strong className="text-ink">Críticas y experiencia de uso:</strong> ideas para
                hacer la comparación o el test más claros y neutrales.
              </li>
            </ul>
          </div>

          <div className="space-y-3 rounded-[4px] border border-line bg-surface-muted/60 p-5">
            <h2 className="text-base font-extrabold text-ink">Incidencia pública en GitHub</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Si prefieres que tu propuesta o reporte quede visible en el repositorio del proyecto,
              puedes abrir una incidencia directamente en GitHub.
            </p>
            <a
              href="https://github.com/javirodel/Programas29N/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-[4px] border border-line-strong bg-surface px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:border-ink"
            >
              Abrir incidencia en GitHub ↗
            </a>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            Consulta también nuestra{" "}
            <Link
              href="/metodologia"
              className="font-semibold text-ink underline underline-offset-4"
            >
              metodología editorial
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-ink underline underline-offset-4"
            >
              política de privacidad
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
