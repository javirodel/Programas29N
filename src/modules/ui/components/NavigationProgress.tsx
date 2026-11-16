"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRouteKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const [startedAtKey, setStartedAtKey] = useState<string | null>(null);
  const routeKeyRef = useRef(currentRouteKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    routeKeyRef.current = currentRouteKey;
  }, [currentRouteKey]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href") ?? "";
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:")) return;

      try {
        const dest = new URL(anchor.href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        const current = new URL(window.location.href);
        if (dest.pathname === current.pathname && dest.search === current.search) return;

        setStartedAtKey(routeKeyRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setStartedAtKey(null), 10000);
      } catch {
        // Ignorar URLs no válidas
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navigating = startedAtKey !== null && startedAtKey === currentRouteKey;
  if (!navigating) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-civic/15"
    >
      <div className="loading-bar-indeterminate h-full w-1/2 bg-civic shadow-[0_0_8px_var(--color-accent-primary)]" />
    </div>
  );
}
