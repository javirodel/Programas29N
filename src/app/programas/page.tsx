import type { Metadata } from "next";
import { ProgramCatalog } from "@/modules/catalog/ProgramCatalog";
import { getCatalogData } from "@/modules/catalog/view-model";
import { getAllPartyAnalytics } from "@/modules/corpus/repository";
import type { PartyProgramAnalytics } from "@/modules/corpus/stats";
import { PENDING_CONGRESS_PARTIES } from "@/modules/ui/party-colors";

export const metadata: Metadata = {
  title: "Los partidos y sus programas | 29N",
  description:
    "Explora todas las candidaturas del 29N: bloques prioritarios, palabras características, extensión, enlaces al PDF oficial y propuestas por tema.",
};

export default async function ProgramasPage() {
  const [{ entries }, analyticsList] = await Promise.all([
    getCatalogData(),
    getAllPartyAnalytics(),
  ]);

  const analyticsByParty: Record<string, PartyProgramAnalytics> = {};
  for (const item of analyticsList) {
    analyticsByParty[item.partyId] = item;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2.5">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Los partidos
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-ink-secondary sm:text-lg">
          Los programas de los partidos que comparamos: todo lo que ves en 29N sale de estos
          documentos.{" "}
          <strong className="font-semibold text-ink">
            {entries.length} candidaturas han publicado ya su programa
          </strong>{" "}
          para el 29 de noviembre y seguimos a las {PENDING_CONGRESS_PARTIES.length} formaciones del
          Congreso saliente aún pendientes.
        </p>
      </header>

      <ProgramCatalog entries={entries} analyticsByParty={analyticsByParty} />
    </div>
  );
}
