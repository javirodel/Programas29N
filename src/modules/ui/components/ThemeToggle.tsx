"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/modules/ui/cn";

type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "color-scheme";
const PREFERENCE_CHANGE_EVENT = "29n-color-scheme-change";

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Silencio seguro si localStorage está bloqueado
  }
  return "system";
}

function applyPreference(pref: ThemePreference) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const content = pref === "system" ? "light dark" : pref;
  if (meta) {
    meta.content = content;
  }
  try {
    if (pref === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    // noop
  }
  window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
}

function subscribePreference(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const next = readPreference();
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (meta) {
        meta.content = next === "system" ? "light dark" : next;
      }
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFERENCE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFERENCE_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeSystemDark(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function readSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const OPTIONS: Array<{ value: ThemePreference; label: string; shortLabel: string }> = [
  { value: "system", label: "Seguir preferencia del sistema", shortLabel: "Auto" },
  { value: "light", label: "Activar modo claro", shortLabel: "Claro" },
  { value: "dark", label: "Activar modo oscuro", shortLabel: "Oscuro" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => "system",
  );
  const systemDark = useSyncExternalStore<boolean>(
    subscribeSystemDark,
    readSystemDark,
    () => false,
  );
  const mounted = useSyncExternalStore<boolean>(
    () => () => {},
    () => true,
    () => false,
  );

  const activeSystemHint = mounted ? (systemDark ? "oscuro" : "claro") : "sistema";

  return (
    <div
      role="group"
      aria-label="Selector de tema de color"
      className={cn(
        "inline-flex items-center rounded-lg border border-line bg-surface-muted p-0.5 text-xs",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = mounted ? preference === opt.value : opt.value === "system";
        const ariaLabel =
          opt.value === "system" ? `${opt.label} (actualmente ${activeSystemHint})` : opt.label;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-label={ariaLabel}
            title={ariaLabel}
            onClick={() => applyPreference(opt.value)}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              active
                ? "bg-surface text-ink shadow-xs ring-1 ring-line"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {opt.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
