"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  style?: CSSProperties;
  id?: string;
  "aria-labelledby"?: string;
}

export function ScrollReveal({
  children,
  delayMs = 0,
  className = "",
  as = "div",
  style,
  id,
  "aria-labelledby": ariaLabelledBy,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px 40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const commonProps = {
    id,
    "aria-labelledby": ariaLabelledBy,
    "data-visible": visible ? "true" : "false",
    style: { ...style, "--reveal-delay": `${delayMs}ms` } as CSSProperties,
    className: `scroll-reveal ${className}`,
  };

  if (as === "li") {
    return (
      <li
        ref={(el) => {
          ref.current = el;
        }}
        {...commonProps}
      >
        {children}
      </li>
    );
  }

  if (as === "section") {
    return (
      <section
        ref={(el) => {
          ref.current = el;
        }}
        {...commonProps}
      >
        {children}
      </section>
    );
  }

  if (as === "article") {
    return (
      <article
        ref={(el) => {
          ref.current = el;
        }}
        {...commonProps}
      >
        {children}
      </article>
    );
  }

  return (
    <div
      ref={(el) => {
        ref.current = el;
      }}
      {...commonProps}
    >
      {children}
    </div>
  );
}
