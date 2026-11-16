import type { z } from "zod";
import type {
  AiAnnotationsSchema,
  AnnotationOverlayEntrySchema,
  AnnotationOverlayFileSchema,
  AnnotationSourceSchema,
  CorpusDatasetSchema,
  CoveragePartySummarySchema,
  CoverageReportSchema,
  EvidenceSchema,
  FactCheckStatusSchema,
  LikertScoreSchema,
  MatchQualitySchema,
  MetadataOriginSchema,
  PartyIdSchema,
  PartyPositionSchema,
  PartySchema,
  PositionStatusSchema,
  ProgramSchema,
  ProgramStatsSchema,
  ProposalKindSchema,
  ProposalSchema,
  RegistryEntrySchema,
  RegistryFileSchema,
  ReviewHistoryEntrySchema,
  ReviewOverlayEntrySchema,
  ReviewOverlayFileSchema,
  ReviewSchema,
  ReviewStatusSchema,
  SourceDocumentSchema,
  SurveyBankFileSchema,
  SurveyDatasetSchema,
  SurveyModeSchema,
  SurveyQuestionSchema,
  TaxonomyFileSchema,
  ThemeSchema,
  VerificationSchema,
} from "./schema";

export type PartyId = z.infer<typeof PartyIdSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
export type MetadataOrigin = z.infer<typeof MetadataOriginSchema>;

export interface Verifiable<T> {
  value: T | null;
  verification: Verification;
  origin: MetadataOrigin;
  verified_by?: string;
  verified_at?: string;
  note?: string;
}

export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type MatchQuality = z.infer<typeof MatchQualitySchema>;
export type PositionStatus = z.infer<typeof PositionStatusSchema>;
export type LikertScore = z.infer<typeof LikertScoreSchema>;
export type Party = z.infer<typeof PartySchema>;
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;
export type ProgramStats = z.infer<typeof ProgramStatsSchema>;
export type Program = z.infer<typeof ProgramSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type ReviewHistoryEntry = z.infer<typeof ReviewHistoryEntrySchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ProposalKind = z.infer<typeof ProposalKindSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type PartyPosition = z.infer<typeof PartyPositionSchema>;
export type SurveyMode = z.infer<typeof SurveyModeSchema>;
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export type RegistryFile = z.infer<typeof RegistryFileSchema>;
export type TaxonomyFile = z.infer<typeof TaxonomyFileSchema>;
export type ReviewOverlayEntry = z.infer<typeof ReviewOverlayEntrySchema>;
export type ReviewOverlayFile = z.infer<typeof ReviewOverlayFileSchema>;
export type SurveyBankFile = z.infer<typeof SurveyBankFileSchema>;
export type CorpusDataset = z.infer<typeof CorpusDatasetSchema>;
export type SurveyDataset = z.infer<typeof SurveyDatasetSchema>;
export type CoveragePartySummary = z.infer<typeof CoveragePartySummarySchema>;
export type CoverageReport = z.infer<typeof CoverageReportSchema>;
export type AnnotationSource = z.infer<typeof AnnotationSourceSchema>;
export type FactCheckStatus = z.infer<typeof FactCheckStatusSchema>;
export type AiAnnotations = z.infer<typeof AiAnnotationsSchema>;
export type AnnotationOverlayEntry = z.infer<typeof AnnotationOverlayEntrySchema>;
export type AnnotationOverlayFile = z.infer<typeof AnnotationOverlayFileSchema>;

/**
 * Vista pública de una propuesta (Decisión D-006 v1.2):
 * incluye `ai_annotations` para mostrarse exclusivamente en el desplegable
 * «A favor y en contra», separado del texto literal oficial del programa.
 */
export type PublicProposal = Proposal;
