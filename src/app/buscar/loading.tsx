import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function BuscarLoading() {
  return (
    <PageSkeleton
      title="Abriendo buscador del corpus…"
      subtitle="Indexando 7.926 propuestas literales de los 26 programas oficiales."
      cards={4}
    />
  );
}
