import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Literata } from "next/font/google";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { loadCoverageReport } from "@/modules/corpus/repository";
import { NavBar } from "@/modules/ui/components/NavBar";
import { NavigationProgress } from "@/modules/ui/components/NavigationProgress";
import { ScrollToTopButton } from "@/modules/ui/components/ScrollToTopButton";
import { SkipToContent } from "@/modules/ui/components/SkipToContent";
import "@/modules/ui/tokens.css";

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-app-sans",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-app-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://programa29n.app"),
  title: {
    default: "29N · Programas Electorales — Test, Comparador y Evidencia",
    template: "%s | 29N · Programas Electorales",
  },
  description:
    "Plataforma cívica neutral y accesible para consultar los 26 programas electorales oficiales del 29N, comparar posturas con trazabilidad documental al PDF original y realizar el test de afinidad.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://programa29n.app",
    siteName: "Programa29N",
    title: "Programa29N — Consulta y compara los 26 programas electorales",
    description:
      "Consulta 7.926 medidas oficiales de 26 candidaturas con cita exacta al PDF, compara posturas frente a frente y haz el test de afinidad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programa29N — Consulta y compara los 26 programas electorales",
    description:
      "Plataforma cívica neutral para consultar los 26 programas del 29N, comparar medidas con enlace al PDF original y realizar el test de afinidad.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

interface RootLayoutProps {
  children: ReactNode;
}

const COLOR_SCHEME_INIT_SCRIPT =
  'try{var s=localStorage.getItem("color-scheme");if(s==="light"||s==="dark"){var m=document.querySelector(\'meta[name="color-scheme"]\');if(m)m.setAttribute("content",s);}}catch(e){}';

export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const coverage = await loadCoverageReport();
  const formattedBuildDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(coverage.generated_at));

  return (
    <html
      lang="es"
      className={`${atkinsonHyperlegible.variable} ${literata.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-ink antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SkipToContent />

        <NavBar />

        <main
          id="contenido-principal"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
        >
          {children}
        </main>

        <ScrollToTopButton />

        <footer className="border-t border-[#263352] bg-[#19233c] text-slate-200">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* Marca y verificación del corpus */}
              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <Link
                  href="/"
                  className="inline-block text-lg font-extrabold tracking-tight text-white hover:text-slate-200"
                >
                  Programa29N
                </Link>
                <p className="text-sm leading-relaxed text-slate-300">
                  Proyecto cívico independiente y sin afiliación política. Reunimos las medidas
                  literales de cada programa oficial con enlace directo a la página del PDF.
                </p>
                <div className="rounded-[4px] border border-[#2f3d61] bg-[#141d33] px-3 py-2 text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    {coverage.totals.parties} programas ·{" "}
                    {coverage.totals.published.toLocaleString("es-ES")} medidas
                  </p>
                  <p className="mt-0.5 text-slate-400">Actualizado {formattedBuildDate}</p>
                </div>
              </div>

              {/* Explorar */}
              <nav aria-label="Explorar la plataforma" className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Explorar
                </h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>
                    <Link href="/programas" className="hover:text-white hover:underline">
                      Programas oficiales
                    </Link>
                  </li>
                  <li>
                    <Link href="/comparar" className="hover:text-white hover:underline">
                      Comparador frente a frente
                    </Link>
                  </li>
                  <li>
                    <Link href="/encuesta" className="hover:text-white hover:underline">
                      Test de afinidad
                    </Link>
                  </li>
                  <li>
                    <Link href="/buscar" className="hover:text-white hover:underline">
                      Buscador de medidas
                    </Link>
                  </li>
                  <li>
                    <Link href="/estadisticas" className="hover:text-white hover:underline">
                      Vocabulario y estadísticas
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Transparencia */}
              <nav aria-label="Transparencia y datos" className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Transparencia
                </h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>
                    <Link href="/metodologia" className="hover:text-white hover:underline">
                      Metodología y fuentes
                    </Link>
                  </li>
                  <li>
                    <Link href="/aviso-legal#respaldo" className="hover:text-white hover:underline">
                      Respaldo SHA-256
                    </Link>
                  </li>
                  <li>
                    <a
                      href="/api/audit"
                      download="respaldo_auditoria_29N.json"
                      className="hover:text-white hover:underline"
                    >
                      Manifiesto de auditoría (JSON)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/javirodel/Programas29N"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white hover:underline"
                    >
                      Repositorio en GitHub ↗
                    </a>
                  </li>
                </ul>
              </nav>

              {/* Contacto y legal */}
              <nav aria-label="Contacto y legal" className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contacto y legal
                </h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>
                    <Link href="/contacto" className="font-semibold text-white hover:underline">
                      Contacto y sugerencias
                    </Link>
                  </li>
                  <li>
                    <Link href="/aviso-legal" className="hover:text-white hover:underline">
                      Aviso legal y licencias
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="hover:text-white hover:underline">
                      Política de privacidad
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-[#263352] pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Programa29N · Código abierto bajo licencia MIT</p>
              <p>Sin cookies de rastreo, sin analítica invasiva y sin afiliación partidista</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
