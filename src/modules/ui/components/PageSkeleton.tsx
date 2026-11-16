export function PageSkeleton({
  title,
  subtitle,
  cards = 4,
}: {
  title: string;
  subtitle: string;
  cards?: number;
}) {
  return (
    <div role="status" aria-live="polite" className="animate-panel-switch space-y-8">
      {/* Barra superior animada + cabecera informativa */}
      <div className="space-y-4 rounded-[6px] border border-line bg-surface p-5 shadow-2xs sm:p-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="loading-bar-indeterminate h-full w-1/2 rounded-full bg-civic" />
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-ink text-xs font-extrabold tracking-tight text-canvas animate-pulse">
            29N
          </div>
          <div className="space-y-1">
            <p className="text-base font-extrabold text-ink sm:text-lg">{title}</p>
            <p className="text-xs text-ink-secondary sm:text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filtros simulados */}
      <div className="flex flex-wrap gap-2">
        <div className="skeleton-shimmer h-9 w-36 rounded-[4px]" />
        <div className="skeleton-shimmer h-9 w-44 rounded-[4px]" />
        <div className="skeleton-shimmer h-9 w-32 rounded-[4px]" />
      </div>

      {/* Tarjetas esqueleto */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: cards }).map((_, idx) => (
          <div key={idx} className="space-y-3 rounded-[4px] border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="skeleton-shimmer h-4 w-24 rounded-[3px]" />
              <div className="skeleton-shimmer h-4 w-16 rounded-[3px]" />
            </div>
            <div className="skeleton-shimmer h-6 w-4/5 rounded-[3px]" />
            <div className="space-y-2 pt-1">
              <div className="skeleton-shimmer h-3.5 w-full rounded-[3px]" />
              <div className="skeleton-shimmer h-3.5 w-11/12 rounded-[3px]" />
              <div className="skeleton-shimmer h-3.5 w-3/4 rounded-[3px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
