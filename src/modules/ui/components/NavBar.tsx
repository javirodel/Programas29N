"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/modules/ui/cn";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  {
    href: "/programas",
    label: "Programas",
    match: (p: string) => p === "/programas" || p.startsWith("/programas/"),
  },
  { href: "/comparar", label: "Comparador", match: (p: string) => p.startsWith("/comparar") },
  { href: "/encuesta", label: "Test de afinidad", match: (p: string) => p.startsWith("/encuesta") },
  { href: "/buscar", label: "Buscador", match: (p: string) => p.startsWith("/buscar") },
  {
    href: "/estadisticas",
    label: "Vocabulario",
    match: (p: string) => p.startsWith("/estadisticas"),
  },
  {
    href: "/metodologia",
    label: "Metodología",
    match: (p: string) => p.startsWith("/metodologia"),
  },
];

export function NavBar() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex shrink-0 items-baseline gap-2.5 whitespace-nowrap text-ink hover:text-civic"
        >
          <span className="text-xl font-extrabold tracking-tight">29N</span>
          <span className="hidden text-xs font-medium text-ink-muted xl:inline">
            Elecciones generales del 29 de noviembre
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden shrink-0 items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap border-b-2 px-2.5 py-1.5 text-sm transition-colors duration-200",
                  active
                    ? "border-ink font-bold text-ink"
                    : "border-transparent font-medium text-ink-secondary hover:border-line-strong hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="inline-flex items-center rounded-[3px] border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted md:hidden"
            aria-expanded={menuOpen}
            aria-controls="nav-principal-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="nav-principal-menu"
          aria-label="Principal móvil"
          className="space-y-3 border-t border-line bg-surface px-4 py-3 md:hidden"
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-[3px] border-l-2 px-3 py-2 text-sm font-medium",
                      active
                        ? "border-ink bg-surface-muted font-bold text-ink"
                        : "border-transparent text-ink-secondary hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-line pt-3 sm:hidden">
            <span className="text-xs font-medium text-ink-muted">Apariencia</span>
            <ThemeToggle />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
