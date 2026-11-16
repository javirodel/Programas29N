import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function CompararLoading() {
  return (
    <PageSkeleton
      title="Cargando comparador de programas…"
      subtitle="Preparando las posturas y citas documentales de los partidos seleccionados."
      cards={4}
    />
  );
}
