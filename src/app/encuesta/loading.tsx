import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function EncuestaLoading() {
  return (
    <PageSkeleton
      title="Cargando test de afinidad…"
      subtitle="Preparando las 15 cuestiones clave y sus referencias documentales."
      cards={2}
    />
  );
}
