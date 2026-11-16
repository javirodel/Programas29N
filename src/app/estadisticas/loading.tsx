import { PageSkeleton } from "@/modules/ui/components/PageSkeleton";

export default function EstadisticasLoading() {
  return (
    <PageSkeleton
      title="Calculando estadísticas y vocabulario…"
      subtitle="Analizando frecuencias léxicas, TF-IDF y distribución temática del corpus."
      cards={4}
    />
  );
}
