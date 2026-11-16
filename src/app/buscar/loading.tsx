import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function BuscarLoading() {
  return (
    <PageSkeleton
      title="Abriendo buscador del corpus…"
      subtitle="Indexando 5.681 propuestas literales de los 20 programas oficiales."
      cards={4}
    />
  );
}
