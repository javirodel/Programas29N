import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function ProgramaPartyLoading() {
  return (
    <PageSkeleton
      title="Cargando programa electoral…"
      subtitle="Organizando bloques temáticos, citas verificadas y páginas del PDF oficial."
      cards={4}
    />
  );
}
