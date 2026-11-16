"use client";

import { useEffect, useState } from "react";

/**
 * Botón flotante que aparece suavemente al desplazarse hacia abajo y permite
 * volver a la parte superior de la página con una transición fluida.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        scrollable > 0 ? Math.min(100, Math.max(0, Math.round((y / scrollable) * 100))) : 0;
      setVisible(y > 320);
      setProgress(pct);
    };

    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleClick = () => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Volver arriba"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-visible={visible ? "true" : "false"}
      className="floating-top-btn fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/95 px-3.5 py-2 text-xs font-bold text-ink shadow-lg backdrop-blur hover:border-ink hover:bg-ink hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-3.5 w-3.5"
      >
        <path d="M8 13V3m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Subir</span>
      <span className="font-mono text-[10px] opacity-70">{progress}%</span>
    </button>
  );
}
