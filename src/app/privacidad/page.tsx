import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/modules/ui/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Aviso de privacidad | 29N",
  description:
    "Política de privacidad de 29N: sin cookies de seguimiento, sin perfiles ideológicos y cálculo íntegro en el dispositivo.",
};

const PRIVACY_PILLARS = [
  {
    number: "01",
    title: "Test de afinidad 100 % en local",
    bodyPrefix: "Las respuestas que introduces en el cuestionario de ",
    linkHref: "/encuesta",
    linkLabel: "/encuesta",
    bodySuffix:
      " se procesan exclusivamente en la memoria de tu navegador. Nunca se envían a servidores externos, no se guardan en bases de datos y se borran al cerrar o reiniciar la sesión.",
  },
  {
    number: "02",
    title: "Cero cookies de seguimiento",
    body: "No utilizamos cookies publicitarias, píxeles de seguimiento ni herramientas de analítica comportamental de terceros. Tampoco recopilamos direcciones IP con fines de perfilado electoral.",
  },
  {
    number: "03",
    title: "Preferencia visual técnica",
    bodyPrefix: "El único almacenamiento local técnico empleado es ",
    code1: "localStorage",
    bodyMid: " para recordar tu preferencia manual de tema claro u oscuro (",
    code2: "color-scheme",
    bodySuffix: ").",
  },
  {
    number: "04",
    title: "Búsquedas y consultas públicas",
    body: "Las consultas en el comparador, catálogo y buscador son anónimas. Al abrir un enlace hacia sitios web externos oficiales de los partidos, aplican las políticas propias de cada organización.",
  },
] as const;

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-3 border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Privacidad por diseño
        </p>
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Aviso de privacidad y ausencia de rastreo
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink-secondary">
          Esta plataforma cívica ha sido diseñada para que puedas explorar programas electorales y
          completar el test de afinidad sin ceder datos personales ni dejar rastro de tu orientación
          política.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        {PRIVACY_PILLARS.map((item, idx) => (
          <ScrollReveal
            key={item.number}
            as="article"
            delayMs={idx * 60}
            className="space-y-2.5 border-t border-line pt-5"
          >
            <span className="font-mono text-xs font-bold tracking-wider text-civic">
              {item.number}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-ink">{item.title}</h2>
            <p className="text-sm leading-relaxed text-ink-secondary">
              {"linkHref" in item ? (
                <>
                  {item.bodyPrefix}
                  <Link href={item.linkHref} className="link-draw font-semibold text-civic">
                    {item.linkLabel}
                  </Link>
                  {item.bodySuffix}
                </>
              ) : "code1" in item ? (
                <>
                  {item.bodyPrefix}
                  <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                    {item.code1}
                  </code>
                  {item.bodyMid}
                  <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                    {item.code2}
                  </code>
                  {item.bodySuffix}
                </>
              ) : (
                item.body
              )}
            </p>
          </ScrollReveal>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm">
        <Link href="/aviso-legal" className="link-draw font-semibold text-civic">
          Ver aviso legal, licencias y respaldo documental →
        </Link>
        <Link href="/metodologia" className="link-draw text-ink-secondary hover:text-ink">
          Cómo funciona la metodología →
        </Link>
      </footer>
    </div>
  );
}
