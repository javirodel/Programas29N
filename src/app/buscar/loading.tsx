import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function BuscarLoading() {
  return (
    <PageSkeleton
      title="Abriendo buscador del corpus…"
      subtitle="Indexando 6.123 propuestas literales de los 21 programas oficiales."
      cards={4}
    />
  );
}
