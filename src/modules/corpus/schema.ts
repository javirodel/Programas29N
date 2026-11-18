import { z } from "zod";

export const SUPPORTED_SCHEMA_MAJOR = 1;

export const SemverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Se requiere versión SemVer (MAJOR.MINOR.PATCH).")
  .refine(
    (v) => Number.parseInt(v.split(".")[0] ?? "0", 10) === SUPPORTED_SCHEMA_MAJOR,
    `Versión MAJOR incompatible; se esperaba ${SUPPORTED_SCHEMA_MAJOR}.x.x.`,
  );

export const PartyIdSchema = z.enum([
  "adelante-andalucia",
  "bng",
  "coalicion-canaria",
  "compromis",
  "eh-bildu",
  "erc",
  "falange",
  "frente-amplio",
  "frente-obrero",
  "iustitia-europa",
  "pacma",
  "partido-humanista",
  "pnv",
  "podemos",
  "por-un-mundo-mas-justo",
  "pp",
  "psoe",
  "salf",
  "soria-ya",
  "teruel-existe",
  "vox",
]);

export const ALL_PARTY_IDS = PartyIdSchema.options;

export const VerificationSchema = z.enum(["no_verificado", "verificado"]);

export const MetadataOriginSchema = z.enum([
  "detallado_ia",
  "metadata_extraccion",
  "revision_manual",
  "calculado",
]);

export function createVerifiableSchema<T extends z.ZodTypeAny>(innerSchema: T) {
  return z
    .object({
      value: innerSchema.nullable(),
      verification: VerificationSchema,
      origin: MetadataOriginSchema,
      verified_by: z.string().min(1).optional(),
      verified_at: z.string().min(1).optional(),
      note: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.verification === "verificado" && !val.verified_by) {
        ctx.addIssue({
          code: "custom",
          message: "Los valores marcados como 'verificado' deben incluir 'verified_by'.",
          path: ["verified_by"],
        });
      }
    });
}

export const VerifiableStringSchema = createVerifiableSchema(z.string());

export const ReviewStatusSchema = z.enum([
  "extraida",
  "requiere_revision",
  "verificada",
  "corregida",
  "rechazada",
]);

export const MatchQualitySchema = z.enum(["literal", "fragmentado", "parcial", "no_localizado"]);

export const PositionStatusSchema = z.enum(["posicion", "insuficiente", "sin_referencia"]);

export const LikertScoreSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const PartySchema = z.object({
  id: PartyIdSchema,
  name: VerifiableStringSchema,
  short_name: VerifiableStringSchema,
  legacy_id_prefix: z.string().min(1),
  website: VerifiableStringSchema,
});

export const ExtractionInfoSchema = z.object({
  tool: z.string().min(1),
  processed_at: z.string().min(1),
  artifacts: z.object({
    md: z.string().min(1),
    json: z.string().min(1),
    txt: z.string().min(1),
    metadata: z.string().min(1),
  }),
  detailed: z.object({
    json: z.string().min(1),
    md: z.string().min(1),
  }),
});

export const SourceDocumentSchema = z.object({
  id: z.string().min(1),
  pdf_path: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  bytes: z.number().int().positive(),
  page_count: z.number().int().positive(),
  original_filename: z.string().min(1),
  official_url: VerifiableStringSchema,
  retrieved_at: VerifiableStringSchema,
  license_note: z.string().nullable(),
  extraction: ExtractionInfoSchema,
});

export const ThemeProgramStatSchema = z.object({
  extracted: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
});

export const ProgramStatsSchema = z.object({
  extracted: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  requires_review: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  verified: z.number().int().nonnegative(),
  by_theme: z.record(z.string(), ThemeProgramStatSchema),
});

export const ProgramSchema = z.object({
  id: z.string().min(1),
  party_id: PartyIdSchema,
  election_id: z.string().min(1),
  title: VerifiableStringSchema,
  publication_date: VerifiableStringSchema,
  source_document_id: z.string().min(1),
  languages: z.array(z.string().min(2)).min(1),
  stats: ProgramStatsSchema,
});

export const ThemeSchema = z.object({
  id: z.string().min(1),
  legacy_id: z.string().min(1),
  order: z.number().int().positive(),
  is_canonical: z.boolean(),
  title: z.string().min(1),
  legacy_title: z.string().min(1),
  description: z.string().min(1),
});

export const EvidenceSchema = z.object({
  source_document_id: z.string().min(1),
  pages: z.array(z.number().int().positive()),
  snippet: z.string().max(600),
  docling_refs: z.array(z.string()),
  match: MatchQualitySchema,
  method: z.enum(["auto_docling", "manual"]),
  verified: z.boolean(),
  pdf_href: z.string().min(1),
});

export const ReviewHistoryEntrySchema = z.object({
  status: ReviewStatusSchema,
  reviewer: z.string().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
});

export const ReviewSchema = z.object({
  status: ReviewStatusSchema,
  history: z.array(ReviewHistoryEntrySchema),
});

export const ProposalKindSchema = z.enum(["propuesta", "reservada"]);

/**
 * Fuente externa que respalda una afirmación del análisis contextual (N3, data/annotations).
 * Solo se admiten URLs https de organismos, legislación, estadísticas oficiales,
 * estudios o medios verificables.
 */
export const AnnotationSourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z
    .string()
    .url()
    .regex(/^https?:\/\//, "La fuente debe ser una URL http(s)."),
  date: z.string().min(1).optional(),
});

export const FactCheckStatusSchema = z.enum(["sin_contrastar", "contrastada", "corregida"]);

export const AiAnnotationsSchema = z.object({
  summary: z.string(),
  arguments_for: z.string(),
  arguments_against: z.string(),
  sources_for: z.array(AnnotationSourceSchema).default([]),
  sources_against: z.array(AnnotationSourceSchema).default([]),
  fact_check: z
    .object({
      status: FactCheckStatusSchema,
      reviewer: z.string().min(1).optional(),
      date: z.string().min(1).optional(),
      note: z.string().min(1).optional(),
    })
    .default({ status: "sin_contrastar" }),
});

/**
 * Overlay N3 de contraste del análisis IA (`data/annotations/*.json`).
 * Permite corregir `explicacion_medida` / `datos_a_favor` / `datos_en_contra`
 * sin tocar la capa N2 y obliga a citar al menos una fuente por columna.
 */
export const AnnotationOverlayEntrySchema = z.object({
  status: z.enum(["contrastada", "corregida"]),
  summary: z.string().min(1).optional(),
  arguments_for: z.string().min(1).optional(),
  arguments_against: z.string().min(1).optional(),
  sources_for: z.array(AnnotationSourceSchema).min(1),
  sources_against: z.array(AnnotationSourceSchema).min(1),
  reviewer: z.string().min(1),
  date: z.string().min(1),
  note: z.string().min(1),
});

export const AnnotationOverlayFileSchema = z.object({
  schema_version: SemverSchema,
  party_id: PartyIdSchema,
  entries: z.record(z.string(), AnnotationOverlayEntrySchema),
});

export const ProposalSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+-\d{3}$/),
  legacy_id: z.string().min(1),
  program_id: z.string().min(1),
  party_id: PartyIdSchema,
  extraction_number: z.number().int().positive(),
  official_number: VerifiableStringSchema,
  kind: ProposalKindSchema,
  title: z.object({
    text: z.string().min(1),
    origin: z.enum(["detallado_ia", "revision_manual"]),
  }),
  official_text: z.object({
    text: z.string().min(1),
    origin: z.enum(["detallado_ia", "docling", "revision_manual"]),
    language: z.string().min(2),
  }),
  original_section: VerifiableStringSchema,
  theme_id: z.string().min(1),
  theme_assignment: z.object({
    method: z.enum(["ia", "manual"]),
    reviewed: z.boolean(),
  }),
  evidence: z.array(EvidenceSchema),
  review: ReviewSchema,
  ai_annotations: AiAnnotationsSchema,
  flags: z.array(z.string()),
});

export const PartyPositionSchema = z
  .object({
    status: PositionStatusSchema,
    value: LikertScoreSchema.nullable(),
    evidence_proposal_ids: z.array(z.string()),
    rationale: z.string().min(1),
    origin: z.enum(["ia_borrador", "manual"]),
    review: ReviewSchema,
  })
  .superRefine((pos, ctx) => {
    if (pos.status === "posicion" && pos.value === null) {
      ctx.addIssue({
        code: "custom",
        message: "Si status = 'posicion', 'value' debe ser un entero entre -2 y +2.",
        path: ["value"],
      });
    }
    if (pos.status !== "posicion" && pos.value !== null) {
      ctx.addIssue({
        code: "custom",
        message: "Si status != 'posicion', 'value' debe ser obligatoriamente null.",
        path: ["value"],
      });
    }
    if (
      (pos.status === "posicion" || pos.status === "insuficiente") &&
      pos.evidence_proposal_ids.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Las posiciones con status 'posicion' o 'insuficiente' requieren al menos una propuesta de evidencia.",
        path: ["evidence_proposal_ids"],
      });
    }
  });

export const SurveyModeSchema = z.enum(["5min", "10min", "15min"]);

export const SurveyQuestionSchema = z
  .object({
    id: z.string().regex(/^q-[a-z0-9-]+-\d{2}$/),
    statement: z.string().min(10),
    context_note: z.string().optional(),
    theme_id: z.string().min(1),
    modes: z.array(SurveyModeSchema).min(1),
    positions: z.record(PartyIdSchema, PartyPositionSchema),
    review: ReviewSchema,
  })
  .superRefine((q, ctx) => {
    for (const partyId of ALL_PARTY_IDS) {
      if (!(partyId in q.positions)) {
        ctx.addIssue({
          code: "custom",
          message: `Falta la codificación obligatoria del partido '${partyId}' en la pregunta '${q.id}'.`,
          path: ["positions", partyId],
        });
      }
    }
  });

export const RegistryEntrySchema = z.object({
  party: PartySchema,
  program: ProgramSchema.omit({ stats: true }),
  document: SourceDocumentSchema.omit({ sha256: true, bytes: true }).extend({
    expected_sha256: z.string().regex(/^[0-9a-f]{64}$/),
    expected_extracted_count: z.number().int().positive(),
    requires_editorial_remediation: z.boolean(),
  }),
});

export const RegistryFileSchema = z.object({
  schema_version: SemverSchema,
  election_id: z.string().min(1),
  election_name: z.string().min(1),
  election_date: z.string().min(1),
  entries: z.array(RegistryEntrySchema).length(21),
});

export const TaxonomyFileSchema = z.object({
  schema_version: SemverSchema,
  themes: z.array(ThemeSchema).min(20),
});

export const ReviewOverlayEntrySchema = z.object({
  kind: ProposalKindSchema.optional(),
  status: ReviewStatusSchema,
  title: z.string().min(1).optional(),
  official_text: z
    .object({
      text: z.string().min(1),
      language: z.string().min(2).optional(),
    })
    .optional(),
  original_section: z.string().min(1).optional(),
  official_number: z.string().min(1).optional(),
  theme_id: z.string().min(1).optional(),
  evidence: z
    .array(
      z.object({
        pages: z.array(z.number().int().positive()).min(1),
        snippet: z.string().min(1).max(600),
        docling_refs: z.array(z.string()).default([]),
      }),
    )
    .optional(),
  clear_flags: z.array(z.string()).optional(),
  reviewer: z.string().min(1),
  date: z.string().min(1),
  note: z.string().min(1),
});

export const ReviewOverlayFileSchema = z.object({
  schema_version: SemverSchema,
  party_id: PartyIdSchema,
  entries: z.record(z.string(), ReviewOverlayEntrySchema),
});

export const SurveyBankFileSchema = z.object({
  schema_version: SemverSchema,
  questions: z.array(SurveyQuestionSchema),
});

export const CorpusDatasetSchema = z.object({
  schema_version: SemverSchema,
  generated_at: z.string().min(1),
  election: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    date: z.string().min(1),
  }),
  inputs: z.object({
    pdf_sha256: z.record(z.string(), z.string()),
    review_overlays_loaded: z.array(z.string()),
  }),
  parties: z.array(PartySchema).length(21),
  programs: z.array(ProgramSchema).length(21),
  documents: z.array(SourceDocumentSchema).length(21),
  themes: z.array(ThemeSchema).min(20),
  proposals: z.array(ProposalSchema).length(6131),
});

export const SurveyDatasetSchema = z.object({
  schema_version: SemverSchema,
  generated_at: z.string().min(1),
  questions: z.array(SurveyQuestionSchema),
});

export const CoveragePartySummarySchema = z.object({
  party_id: PartyIdSchema,
  party_name: z.string(),
  short_name: z.string(),
  document_id: z.string(),
  sha256: z.string(),
  bytes: z.number().int().positive(),
  page_count: z.number().int().positive(),
  extraction_tool: z.string(),
  extracted: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  verified: z.number().int().nonnegative(),
  requires_review: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  match_counts: z.record(MatchQualitySchema, z.number().int().nonnegative()),
});

export const CoverageReportSchema = z.object({
  schema_version: SemverSchema,
  generated_at: z.string().min(1),
  totals: z.object({
    parties: z.number().int().positive(),
    extracted: z.number().int().nonnegative(),
    published: z.number().int().nonnegative(),
    verified: z.number().int().nonnegative(),
    requires_review: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    reserved: z.number().int().nonnegative(),
    survey_questions: z.number().int().nonnegative(),
  }),
  by_party: z.array(CoveragePartySummarySchema),
  by_theme: z.record(
    z.string(),
    z.object({
      extracted: z.number().int().nonnegative(),
      published: z.number().int().nonnegative(),
      by_party: z.record(PartyIdSchema, ThemeProgramStatSchema),
    }),
  ),
});

export function isProposalPublishable(proposal: z.infer<typeof ProposalSchema>): boolean {
  if (proposal.kind !== "propuesta") {
    return false;
  }
  const hasValidPageEvidence = proposal.evidence.some((ev) => ev.pages.length > 0);
  if (!hasValidPageEvidence) {
    return false;
  }
  if (proposal.review.status === "verificada" || proposal.review.status === "corregida") {
    return true;
  }
  if (proposal.review.status === "extraida") {
    const primaryMatch = proposal.evidence[0]?.match;
    return primaryMatch === "literal" || primaryMatch === "fragmentado";
  }
  return false;
}

export function isProposalSurveyEligible(proposal: z.infer<typeof ProposalSchema>): boolean {
  if (proposal.kind !== "propuesta") {
    return false;
  }
  const hasValidPageEvidence = proposal.evidence.some((ev) => ev.pages.length > 0);
  if (!hasValidPageEvidence) {
    return false;
  }
  return proposal.review.status === "verificada" || proposal.review.status === "corregida";
}
