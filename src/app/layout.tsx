import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Literata } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { loadCoverageReport } from "@/modules/corpus/repository";
import { NavBar } from "@/modules/ui/components/NavBar";
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
    "Plataforma cívica neutral y accesible para consultar los 20 programas electorales oficiales del 29N, comparar posturas con trazabilidad documental al PDF original y realizar el test de afinidad.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://programa29n.app",
    siteName: "Programa29N",
    title: "Programa29N — Consulta y compara los 20 programas electorales",
    description:
      "Consulta 5.681 medidas oficiales de 20 candidaturas con cita exacta al PDF, compara posturas frente a frente y haz el test de afinidad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programa29N — Consulta y compara los 20 programas electorales",
    description:
      "Plataforma cívica neutral para consultar los 20 programas del 29N, comparar medidas con enlace al PDF original y realizar el test de afinidad.",
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
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
            <div className="max-w-xl space-y-5">
              <div className="space-y-2">
                <p className="text-lg font-extrabold tracking-tight text-white">29N</p>
                <p className="text-sm leading-relaxed text-slate-300">
                  Un proyecto independiente y sin afiliación política. Reunimos las medidas
                  literales de cada programa oficial, añadimos contexto divulgativo separado de la
                  cita y enlazamos siempre a la página exacta del PDF original.
                </p>
              </div>

              <nav aria-label="Pie de página" className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-bold text-white">
                  <Link
                    href="/programas"
                    className="underline underline-offset-4 hover:text-slate-200"
                  >
                    Programas
                  </Link>
                  <Link
                    href="/comparar"
                    className="underline underline-offset-4 hover:text-slate-200"
                  >
                    Comparador
                  </Link>
                  <Link
                    href="/encuesta"
                    className="underline underline-offset-4 hover:text-slate-200"
                  >
                    Test de afinidad
                  </Link>
                  <Link
                    href="/metodologia"
                    className="underline underline-offset-4 hover:text-slate-200"
                  >
                    Metodología
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-300">
                  <Link href="/buscar" className="underline underline-offset-4 hover:text-white">
                    Buscador de medidas
                  </Link>
                  <Link
                    href="/estadisticas"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Estadísticas y palabras
                  </Link>
                  <Link
                    href="/aviso-legal#respaldo"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Datos abiertos y respaldo (SHA-256)
                  </Link>
                  <Link
                    href="/aviso-legal"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Aviso legal y licencias
                  </Link>
                  <Link
                    href="/privacidad"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Privacidad
                  </Link>
                </div>
              </nav>
            </div>

            <div className="space-y-4 text-sm text-slate-300 md:text-right">
              <div className="space-y-1">
                <p>
                  Corpus verificado ·{" "}
                  <strong className="font-semibold text-white">{formattedBuildDate}</strong>
                </p>
                <p className="text-xs text-slate-300">
                  {coverage.totals.parties} programas oficiales ·{" "}
                  {coverage.totals.published.toLocaleString("es-ES")} medidas literales
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-300">¿Quieres comprobar fuentes o integridad?</p>
                <p className="flex flex-wrap gap-x-3 md:justify-end">
                  <a
                    href="/api/audit"
                    download="respaldo_auditoria_29N.json"
                    className="font-medium text-white underline underline-offset-4 hover:text-slate-200"
                  >
                    Manifiesto JSON
                  </a>
                  <Link
                    href="/metodologia"
                    className="font-medium text-white underline underline-offset-4 hover:text-slate-200"
                  >
                    Transparencia y fuentes
                  </Link>
                </p>
              </div>

              <p className="text-xs text-slate-400">
                Código bajo licencia MIT · Sin cookies ni rastreo
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
