"use client";

import { useState } from "react";
import type { PublicProposal } from "@/modules/corpus/types";
import { Badge } from "./Badge";
import { buttonClasses } from "./Button";
import { Modal } from "./Modal";
import { ProposalAnalysisDisclosure } from "./ProposalAnalysisDisclosure";

interface EvidenceModalProps {
  proposal: PublicProposal | null;
  partyName?: string;
  onClose: () => void;
}

/**
 * Modal de detalle de propuesta, cita del programa oficial y argumentos a favor y en contra.
 */
export function EvidenceModal({ proposal, partyName, onClose }: EvidenceModalProps) {
  const primaryEvidence = proposal?.evidence[0];
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!proposal || typeof window === "undefined") return;
    const url = `${window.location.origin}/programas/${proposal.party_id}#medida-${proposal.id}`;
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencio si el navegador restringe portapapeles
    }
  };

  return (
    <Modal
      isOpen={proposal !== null}
      onClose={onClose}
      title={proposal?.title.text ?? "Detalle de la propuesta"}
      subtitle={partyName ?? proposal?.party_id}
    >
      {proposal ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {proposal.official_text.language !== "es" ? (
              <Badge variant="neutral">Idioma original: {proposal.official_text.language}</Badge>
            ) : null}
            {proposal.original_section.value ? (
              <Badge variant="neutral">{proposal.original_section.value}</Badge>
            ) : null}
            {primaryEvidence ? (
              <Badge variant="neutral">Pág. {primaryEvidence.pages.join(", ")} del PDF</Badge>
            ) : null}
          </div>

          <section aria-label="Texto literal del programa">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Texto oficial del programa
            </h3>
            <blockquote
              lang={proposal.official_text.language}
              className="mt-2 rounded-xl border border-line bg-surface-muted p-4 text-base leading-relaxed text-ink"
            >
              {proposal.official_text.text}
            </blockquote>
          </section>

          <ProposalAnalysisDisclosure
            defaultOpen
            summary={proposal.ai_annotations.summary}
            argumentsFor={proposal.ai_annotations.arguments_for}
            argumentsAgainst={proposal.ai_annotations.arguments_against}
            sourcesFor={proposal.ai_annotations.sources_for}
            sourcesAgainst={proposal.ai_annotations.sources_against}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={handleCopyLink}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              {copied ? "Enlace copiado ✓" : "Copiar enlace"}
            </button>

            {primaryEvidence ? (
              <a
                href={primaryEvidence.pdf_href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                Abrir PDF oficial en pág. {primaryEvidence.pages[0] ?? 1} ↗
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
