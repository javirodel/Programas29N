"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/modules/ui/components/Button";

type ContactCategory = "sugerencia" | "correccion" | "programa_faltante" | "error_tecnico" | "otro";

const CATEGORY_OPTIONS: Array<{ value: ContactCategory; label: string }> = [
  { value: "sugerencia", label: "Sugerencia o mejora de la web" },
  { value: "correccion", label: "Corrección de una medida, cita o página" },
  { value: "programa_faltante", label: "Nuevo programa oficial publicado" },
  { value: "error_tecnico", label: "Error técnico o de accesibilidad" },
  { value: "otro", label: "Otro comentario" },
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategory>("sugerencia");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setFeedback(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          website,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setFeedback(payload.error ?? "No se pudo enviar el mensaje. Inténtalo de nuevo.");
        return;
      }

      setStatus("sent");
      setFeedback("Mensaje registrado correctamente. Gracias por ayudarnos a mejorar Programa29N.");
      setName("");
      setEmail("");
      setMessage("");
      setCategory("sugerencia");
    } catch {
      setStatus("error");
      setFeedback("No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[4px] border border-line bg-surface p-5 shadow-2xs sm:p-6"
      noValidate
    >
      {/* Campo trampa oculto para bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Sitio web</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="block text-sm font-bold text-ink">
            Nombre
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre o alias"
            className="w-full rounded-[4px] border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="block text-sm font-bold text-ink">
            Correo electrónico
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={120}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-[4px] border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-category" className="block text-sm font-bold text-ink">
          Motivo del mensaje
        </label>
        <select
          id="contact-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ContactCategory)}
          className="w-full rounded-[4px] border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="contact-message" className="block text-sm font-bold text-ink">
            Mensaje, crítica o propuesta
          </label>
          <span className="font-mono text-xs text-ink-muted">{message.length}/2000</span>
        </div>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Indica qué mejorarías, qué programa falta o qué página/cita debería revisarse…"
          className="w-full rounded-[4px] border border-line bg-canvas px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
      </div>

      <div aria-live="polite">
        {feedback ? (
          <p
            className={`rounded-[4px] border px-3.5 py-2.5 text-sm font-medium ${
              status === "sent"
                ? "border-[var(--color-status-verified-border)] bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified-fg)]"
                : "border-[var(--color-status-contra-border)] bg-[var(--color-status-contra-bg)] text-[var(--color-status-contra-fg)]"
            }`}
          >
            {feedback}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-ink-muted">
          Sin cookies ni listas de correo. Usamos tu dirección únicamente si necesitamos
          responderte.
        </p>
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  );
}
