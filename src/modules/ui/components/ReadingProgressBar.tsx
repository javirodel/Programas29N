"use client";

import { useEffect, useRef } from "react";

interface ReadingProgressBarProps {
  accentColor?: string;
}

export function ReadingProgressBar({ accentColor }: ReadingProgressBarProps) {
  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()")) {
      return;
    }

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.setProperty("--scroll-progress", String(pct));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="h-0.5 w-full overflow-hidden bg-line/60">
      <div
        ref={fillRef}
        className="reading-progress-fill h-full w-full"
        style={{ backgroundColor: accentColor ?? "var(--color-accent-primary)" }}
      />
    </div>
  );
}
