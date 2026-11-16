import type { Metadata } from "next";
import { Suspense } from "react";
import { getParties, getThemes } from "@/modules/corpus/repository";
import { PartyIdSchema } from "@/modules/corpus/schema";
import type { PartyId } from "@/modules/corpus/types";
import { SearchExplorer } from "@/modules/search/SearchExplorer";
import { searchProposals } from "@/modules/search/engine";

export const metadata: Metadata = {
  title: "Buscador de Propuestas | 29N",
  description:
    "Busca palabras clave en los programas electorales del 29N filtrando por candidatura y bloque temático.",
};

interface BuscarPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readParamList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const joined = Array.isArray(value) ? value.join(",") : value;
  return joined
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawParties = readParamList(sp.partido);
  const partiesFilter: PartyId[] = rawParties
    .map((id) => PartyIdSchema.safeParse(id))
    .filter((res) => res.success)
    .map((res) => res.data);
  const themesFilter = readParamList(sp.bloque);

  const [initialResult, parties, themes] = await Promise.all([
    searchProposals({
      q,
      parties: partiesFilter,
      themes: themesFilter,
    }),
    getParties(),
    getThemes(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Buscar en los programas
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary sm:text-lg">
          Encuentra propuestas concretas por palabra clave, partido o tema en los {parties.length}{" "}
          programas electorales de 2026.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="rounded-lg border border-line bg-surface p-6 text-sm text-ink-secondary">
            Cargando buscador del corpus…
          </p>
        }
      >
        <SearchExplorer
          initialResult={initialResult}
          initialParties={partiesFilter}
          initialThemes={themesFilter}
          parties={parties.map((p) => ({
            id: p.id,
            shortName: p.short_name.value ?? p.id.toUpperCase(),
            name: p.name.value ?? p.id,
          }))}
          themes={themes.map((t) => ({ id: t.id, title: t.title }))}
        />
      </Suspense>
    </div>
  );
}
