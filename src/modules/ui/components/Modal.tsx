"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { buttonClasses } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Diálogo modal accesible basado en el elemento nativo <dialog>.
 * Maneja cierre con Escape, clic fuera del contenido y retorno de foco.
 */
export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
      previousFocusRef.current?.focus();
    }

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        onClose();
      }
    };
    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="fixed inset-0 m-auto max-h-[88vh] w-[min(42rem,92vw)] overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-slate-900/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
          aria-label="Cerrar ventana"
        >
          Cerrar
        </button>
      </div>
      <div className="px-6 py-5 text-sm leading-relaxed">{children}</div>
    </dialog>
  );
}
