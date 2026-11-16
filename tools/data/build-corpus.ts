import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import MiniSearch from "minisearch";
import {
  ALL_PARTY_IDS,
  AnnotationOverlayFileSchema,
  CorpusDatasetSchema,
  CoverageReportSchema,
  isProposalPublishable,
  isProposalSurveyEligible,
  RegistryFileSchema,
  ReviewOverlayFileSchema,
  SurveyBankFileSchema,
  SurveyDatasetSchema,
  TaxonomyFileSchema,
} from "../../src/modules/corpus/schema.ts";
import type {
  AnnotationOverlayEntry,
  CorpusDataset,
  CoveragePartySummary,
  CoverageReport,
  Evidence,
  MatchQuality,
  PartyId,
  Program,
  Proposal,
  ReviewOverlayFile,
  SourceDocument,
  SurveyQuestion,
} from "../../src/modules/corpus/types.ts";
import {
  MINI_SEARCH_FIELDS,
  MINI_SEARCH_STORE_FIELDS,
  processCivicTerm,
  tokenizeCivicText,
  type IndexedProposalDoc,
} from "../../src/modules/search/text-utils.ts";
import {
  buildDoclingIndex,
  locateEvidence,
  truncateSnippet,
  type DoclingDocumentLike,
} from "./locate-evidence.ts";

const ROOT_DIR = process.cwd();
const GENERATED_DIR = path.join(ROOT_DIR, ".generated");
const REPORTS_DIR = path.join(GENERATED_DIR, "reports");

interface RawDetalladoMeasure {
  numero_medida: number;
  id_medida: string;
  seccion_original: string;
  id_bloque_comun: string;
  titulo_bloque_comun: string;
  titulo_medida: string;
  texto_oficial: string;
  explicacion_medida: string;
  datos_a_favor: string;
  datos_en_contra: string;
}

interface RawDetalladoBlock {
  id_bloque: string;
  titulo_bloque: string;
  medidas: RawDetalladoMeasure[];
}

interface RawDetalladoFile {
  total_medidas: number;
  bloques: RawDetalladoBlock[];
  otros_bloques?: RawDetalladoBlock[];
}

async function computeFileSha256(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex").toLowerCase();
}

async function readJsonUtf8<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  const strippedBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(strippedBom) as T;
}

const EDITORIAL_BRACKET_NOTE_REGEX = /\[(?:Medida|Nota|Resumen|Fuente|Cap[ií]tulo)\b[^\]]*\]/i;

function hasEditorialBracketAnnotation(text: string): boolean {
  return EDITORIAL_BRACKET_NOTE_REGEX.test(text);
}

async function loadReviewOverlays(): Promise<{
  byParty: Partial<Record<PartyId, ReviewOverlayFile>>;
  loadedFiles: string[];
}> {
  const reviewsDir = path.join(ROOT_DIR, "data", "reviews");
  if (!existsSync(reviewsDir)) {
    return { byParty: {}, loadedFiles: [] };
  }

  const files = (await readdir(reviewsDir)).filter((f) => f.endsWith(".json")).sort();
  const byParty: Partial<Record<PartyId, ReviewOverlayFile>> = {};
  const loadedFiles: string[] = [];

  for (const filename of files) {
    const fullPath = path.join(reviewsDir, filename);
    const raw = await readJsonUtf8<unknown>(fullPath);
    const parsed = ReviewOverlayFileSchema.parse(raw);
    const existing = byParty[parsed.party_id];
    if (existing) {
      // Se admiten varios ficheros por partido (p. ej. `pp.json` + `pp.factcheck-part1.json`)
      for (const [proposalId, entry] of Object.entries(parsed.entries)) {
        if (existing.entries[proposalId]) {
          throw new Error(
            `Overlay de revisión duplicado para '${proposalId}' (fichero data/reviews/${filename}).`,
          );
        }
        existing.entries[proposalId] = entry;
      }
    } else {
      byParty[parsed.party_id] = parsed;
    }
    loadedFiles.push(`data/reviews/${filename}`);
  }

  return { byParty, loadedFiles };
}

/**
 * Carga los overlays N3 de contraste del análisis IA (`data/annotations/*.json`).
 * Se admiten varios ficheros por partido (p. ej. `bng.part1.json`, `bng.part2.json`);
 * una misma propuesta no puede aparecer en dos ficheros.
 */
async function loadAnnotationOverlays(): Promise<{
  byParty: Partial<Record<PartyId, Record<string, AnnotationOverlayEntry>>>;
  loadedFiles: string[];
}> {
  const annotationsDir = path.join(ROOT_DIR, "data", "annotations");
  if (!existsSync(annotationsDir)) {
    return { byParty: {}, loadedFiles: [] };
  }

  const files = (await readdir(annotationsDir)).filter((f) => f.endsWith(".json")).sort();
  const byParty: Partial<Record<PartyId, Record<string, AnnotationOverlayEntry>>> = {};
  const loadedFiles: string[] = [];

  for (const filename of files) {
    const fullPath = path.join(annotationsDir, filename);
    const parsed = AnnotationOverlayFileSchema.parse(await readJsonUtf8<unknown>(fullPath));
    const target = byParty[parsed.party_id] ?? {};
    for (const [proposalId, entry] of Object.entries(parsed.entries)) {
      if (target[proposalId]) {
        throw new Error(
          `Anotación duplicada para '${proposalId}' (fichero data/annotations/${filename}).`,
        );
      }
      target[proposalId] = entry;
    }
    byParty[parsed.party_id] = target;
    loadedFiles.push(`data/annotations/${filename}`);
  }

  return { byParty, loadedFiles };
}

async function loadSurveyQuestions(): Promise<SurveyQuestion[]> {
  const surveyPath = path.join(ROOT_DIR, "data", "survey", "questions.json");
  if (!existsSync(surveyPath)) {
    return [];
  }
  const raw = await readJsonUtf8<unknown>(surveyPath);
  const bank = SurveyBankFileSchema.parse(raw);
  return bank.questions;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const generatedAt = new Date().toISOString();

  const registryPath = path.join(ROOT_DIR, "data", "registry", "documents.json");
  const taxonomyPath = path.join(ROOT_DIR, "data", "taxonomy", "themes.json");

  const registry = RegistryFileSchema.parse(await readJsonUtf8<unknown>(registryPath));
  const taxonomy = TaxonomyFileSchema.parse(await readJsonUtf8<unknown>(taxonomyPath));

  const legacyBlockToThemeId = new Map<string, string>();
  const themeById = new Map(taxonomy.themes.map((t) => [t.id, t]));
  for (const theme of taxonomy.themes) {
    legacyBlockToThemeId.set(theme.legacy_id, theme.id);
  }

  // Invariante 1 (parte A): correspondencia exacta con pdfs_originales/*.pdf
  const diskPdfFiles = (await readdir(path.join(ROOT_DIR, "pdfs_originales")))
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();
  const registeredPdfFiles = registry.entries.map((e) => path.basename(e.document.pdf_path)).sort();

  if (JSON.stringify(diskPdfFiles) !== JSON.stringify(registeredPdfFiles)) {
    throw new Error(
      `Invariante 1 fallida: los PDFs en pdfs_originales/ (${diskPdfFiles.join(", ")}) no coinciden con data/registry/documents.json (${registeredPdfFiles.join(", ")}).`,
    );
  }

  const { byParty: overlaysByParty, loadedFiles: loadedOverlayFiles } = await loadReviewOverlays();
  const { byParty: annotationsByParty, loadedFiles: loadedAnnotationFiles } =
    await loadAnnotationOverlays();

  const parties = registry.entries.map((e) => e.party);
  const documents: SourceDocument[] = [];
  const programs: Program[] = [];
  const allProposals: Proposal[] = [];
  const pdfShaMap: Record<string, string> = {};
  const evidenceReportItems: Array<{
    proposal_id: string;
    legacy_id: string;
    party_id: PartyId;
    match: MatchQuality;
    pages: number[];
    review_status: string;
    publishable: boolean;
  }> = [];
  const coverageByParty: CoveragePartySummary[] = [];

  for (const entry of registry.entries) {
    const partyId = entry.party.id;
    const docSpec = entry.document;
    const pdfFullPath = path.join(ROOT_DIR, docSpec.pdf_path);
    const metadataFullPath = path.join(ROOT_DIR, docSpec.extraction.artifacts.metadata);
    const doclingJsonPath = path.join(ROOT_DIR, docSpec.extraction.artifacts.json);
    const detailedJsonPath = path.join(ROOT_DIR, docSpec.extraction.detailed.json);

    // 1. Verificar integridad SHA-256 contra registro y contra metadata.json
    const [actualSha256, pdfStat, extractionMeta] = await Promise.all([
      computeFileSha256(pdfFullPath),
      stat(pdfFullPath),
      readJsonUtf8<{ sha256?: string }>(metadataFullPath),
    ]);

    const metaSha = (extractionMeta.sha256 ?? "").toLowerCase();
    if (actualSha256 !== docSpec.expected_sha256 || actualSha256 !== metaSha) {
      throw new Error(
        `Fallo crítico de integridad SHA-256 en ${docSpec.id}: calculado=${actualSha256}, esperado=${docSpec.expected_sha256}, metadata=${metaSha}`,
      );
    }

    pdfShaMap[docSpec.id] = actualSha256;

    const sourceDoc: SourceDocument = {
      id: docSpec.id,
      pdf_path: docSpec.pdf_path,
      sha256: actualSha256,
      bytes: pdfStat.size,
      page_count: docSpec.page_count,
      original_filename: docSpec.original_filename,
      official_url: docSpec.official_url,
      retrieved_at: docSpec.retrieved_at,
      license_note: docSpec.license_note,
      extraction: docSpec.extraction,
    };
    documents.push(sourceDoc);

    // 2. Construir índice Docling y leer medidas N2
    const [doclingDoc, detailedData] = await Promise.all([
      readJsonUtf8<DoclingDocumentLike>(doclingJsonPath),
      readJsonUtf8<RawDetalladoFile>(detailedJsonPath),
    ]);

    const doclingIndex = buildDoclingIndex(doclingDoc);

    const rawMeasures: RawDetalladoMeasure[] = [];
    for (const block of detailedData.bloques ?? []) {
      for (const m of block.medidas ?? []) {
        rawMeasures.push(m);
      }
    }
    for (const extraBlock of detailedData.otros_bloques ?? []) {
      for (const m of extraBlock.medidas ?? []) {
        rawMeasures.push(m);
      }
    }

    // Ordenar por numero_medida ascendente para determinismo absoluto
    rawMeasures.sort((a, b) => a.numero_medida - b.numero_medida);

    // Invariante 9: recuento extraído por partido = recuento esperado
    if (rawMeasures.length !== docSpec.expected_extracted_count) {
      throw new Error(
        `Invariante 9 fallida en ${partyId}: extraídas ${rawMeasures.length}, esperadas ${docSpec.expected_extracted_count}.`,
      );
    }

    const partyOverlay = overlaysByParty[partyId];
    const defaultLanguage = entry.program.languages[0] ?? "es";
    const partyProposals: Proposal[] = [];
    const matchCounts: Record<MatchQuality, number> = {
      literal: 0,
      fragmentado: 0,
      parcial: 0,
      no_localizado: 0,
    };

    for (const raw of rawMeasures) {
      const proposalId = `${partyId}-${String(raw.numero_medida).padStart(3, "0")}`;
      const mappedThemeId = raw.id_bloque_comun.startsWith("otro_bloque_")
        ? "otros"
        : (legacyBlockToThemeId.get(raw.id_bloque_comun) ?? "otros");

      if (!themeById.has(mappedThemeId)) {
        throw new Error(`Tema desconocido '${mappedThemeId}' en propuesta ${proposalId}.`);
      }

      const initialLocated = locateEvidence(doclingIndex, sourceDoc.id, raw.texto_oficial);
      const flags = new Set<string>();

      if (defaultLanguage !== "es") {
        flags.add("idioma_no_castellano");
      }
      if (hasEditorialBracketAnnotation(raw.texto_oficial)) {
        flags.add("anotacion_en_texto");
      }
      if (initialLocated.match === "parcial" || initialLocated.match === "no_localizado") {
        flags.add("texto_no_literal");
      }
      if (docSpec.requires_editorial_remediation) {
        flags.add("partido_en_remediacion");
        flags.add("numeracion_no_oficial");
      }

      const needsAutomaticQuarantine =
        initialLocated.match === "parcial" ||
        initialLocated.match === "no_localizado" ||
        flags.has("anotacion_en_texto") ||
        docSpec.requires_editorial_remediation;

      const autoStatus = needsAutomaticQuarantine ? "requiere_revision" : "extraida";

      let proposal: Proposal = {
        id: proposalId,
        legacy_id: raw.id_medida,
        program_id: entry.program.id,
        party_id: partyId,
        extraction_number: raw.numero_medida,
        official_number: {
          value: null,
          verification: "no_verificado",
          origin: "detallado_ia",
        },
        kind: "propuesta",
        title: {
          text: raw.titulo_medida.trim(),
          origin: "detallado_ia",
        },
        official_text: {
          text: raw.texto_oficial.trim(),
          origin: "detallado_ia",
          language: defaultLanguage,
        },
        original_section: {
          value: raw.seccion_original.trim(),
          verification: "no_verificado",
          origin: "detallado_ia",
        },
        theme_id: mappedThemeId,
        theme_assignment: {
          method: "ia",
          reviewed: false,
        },
        evidence:
          initialLocated.pages.length > 0
            ? [
                {
                  source_document_id: sourceDoc.id,
                  pages: initialLocated.pages,
                  snippet: initialLocated.snippet || truncateSnippet(raw.texto_oficial.trim(), 600),
                  docling_refs: initialLocated.doclingRefs,
                  match: initialLocated.match,
                  method: "auto_docling",
                  verified: false,
                  pdf_href: initialLocated.pdfHref,
                },
              ]
            : [],
        review: {
          status: autoStatus,
          history: [
            {
              status: autoStatus,
              reviewer: "pipeline:build-corpus",
              date: sourceDoc.extraction.processed_at,
              note: needsAutomaticQuarantine
                ? `Cuarentena automática (match=${initialLocated.match}, flags=${[...flags].join("|") || "none"})`
                : `Localización automática Docling (${initialLocated.match})`,
            },
          ],
        },
        ai_annotations: {
          summary: raw.explicacion_medida.trim(),
          arguments_for: raw.datos_a_favor.trim(),
          arguments_against: raw.datos_en_contra.trim(),
          sources_for: [],
          sources_against: [],
          fact_check: { status: "sin_contrastar" },
        },
        flags: [...flags],
      };

      // Aplicar overlay N3 de contraste del análisis IA (fuentes y correcciones)
      const annotation = annotationsByParty[partyId]?.[proposalId];
      if (annotation) {
        proposal.ai_annotations = {
          summary: (annotation.summary ?? proposal.ai_annotations.summary).trim(),
          arguments_for: (annotation.arguments_for ?? proposal.ai_annotations.arguments_for).trim(),
          arguments_against: (
            annotation.arguments_against ?? proposal.ai_annotations.arguments_against
          ).trim(),
          sources_for: annotation.sources_for,
          sources_against: annotation.sources_against,
          fact_check: {
            status: annotation.status,
            reviewer: annotation.reviewer,
            date: annotation.date,
            note: annotation.note,
          },
        };
      }

      // Aplicar overlay editorial N3 si existe para esta propuesta
      const overlay = partyOverlay?.entries[proposalId];
      if (overlay) {
        if (overlay.kind) {
          proposal.kind = overlay.kind;
        }
        if (overlay.title) {
          proposal.title = {
            text: overlay.title.trim(),
            origin: "revision_manual",
          };
        }
        if (overlay.official_text) {
          proposal.official_text = {
            text: overlay.official_text.text.trim(),
            origin: "revision_manual",
            language: overlay.official_text.language ?? proposal.official_text.language,
          };
          flags.delete("anotacion_en_texto");
          flags.delete("texto_no_literal");
        }
        if (overlay.original_section) {
          proposal.original_section = {
            value: overlay.original_section.trim(),
            verification: "verificado",
            origin: "revision_manual",
            verified_by: overlay.reviewer,
            verified_at: overlay.date,
          };
        }
        if (overlay.official_number) {
          proposal.official_number = {
            value: overlay.official_number.trim(),
            verification: "verificado",
            origin: "revision_manual",
            verified_by: overlay.reviewer,
            verified_at: overlay.date,
          };
          flags.delete("numeracion_no_oficial");
        }
        if (overlay.theme_id) {
          if (!themeById.has(overlay.theme_id)) {
            throw new Error(
              `Overlay de ${proposalId} referencia theme_id inexistente '${overlay.theme_id}'.`,
            );
          }
          proposal.theme_id = overlay.theme_id;
          proposal.theme_assignment = {
            method: "manual",
            reviewed: true,
          };
        }

        if (overlay.evidence && overlay.evidence.length > 0) {
          const verifiedByHuman = overlay.status === "verificada" || overlay.status === "corregida";
          proposal.evidence = overlay.evidence.map((ev): Evidence => {
            const firstPage = ev.pages[0];
            return {
              source_document_id: sourceDoc.id,
              pages: ev.pages,
              snippet: truncateSnippet(ev.snippet, 600),
              docling_refs: ev.docling_refs,
              match: "literal",
              method: "manual",
              verified: verifiedByHuman,
              pdf_href: firstPage
                ? `/pdfs/${sourceDoc.id}.pdf#page=${firstPage}`
                : `/pdfs/${sourceDoc.id}.pdf`,
            };
          });
          flags.delete("texto_no_literal");
        } else if (overlay.official_text) {
          const relocated = locateEvidence(doclingIndex, sourceDoc.id, proposal.official_text.text);
          if (relocated.pages.length > 0) {
            proposal.evidence = [
              {
                source_document_id: sourceDoc.id,
                pages: relocated.pages,
                snippet: relocated.snippet || truncateSnippet(proposal.official_text.text, 600),
                docling_refs: relocated.doclingRefs,
                match: relocated.match,
                method: "auto_docling",
                verified: overlay.status === "verificada" || overlay.status === "corregida",
                pdf_href: relocated.pdfHref,
              },
            ];
          }
        } else if (
          (overlay.status === "verificada" || overlay.status === "corregida") &&
          proposal.evidence.length > 0
        ) {
          proposal.evidence = proposal.evidence.map((ev) => ({
            ...ev,
            verified: true,
          }));
        }

        if (overlay.status === "verificada" || overlay.status === "corregida") {
          flags.delete("partido_en_remediacion");
          flags.delete("texto_no_literal");
          if (!hasEditorialBracketAnnotation(proposal.official_text.text)) {
            flags.delete("anotacion_en_texto");
          }
        }

        for (const flagToRemove of overlay.clear_flags ?? []) {
          flags.delete(flagToRemove);
        }

        proposal = {
          ...proposal,
          flags: [...flags],
          review: {
            status: overlay.status,
            history: [
              ...proposal.review.history,
              {
                status: overlay.status,
                reviewer: overlay.reviewer,
                date: overlay.date,
                note: overlay.note,
              },
            ],
          },
        };
      }

      const effectiveMatch = proposal.evidence[0]?.match ?? "no_localizado";
      matchCounts[effectiveMatch] += 1;

      partyProposals.push(proposal);
      allProposals.push(proposal);
      evidenceReportItems.push({
        proposal_id: proposal.id,
        legacy_id: proposal.legacy_id,
        party_id: partyId,
        match: effectiveMatch,
        pages: proposal.evidence[0]?.pages ?? [],
        review_status: proposal.review.status,
        publishable: isProposalPublishable(proposal),
      });
    }

    // Verificar que no haya entradas huérfanas en el overlay del partido
    if (partyOverlay) {
      const validIds = new Set(partyProposals.map((p) => p.id));
      for (const overlayPropId of Object.keys(partyOverlay.entries)) {
        if (!validIds.has(overlayPropId)) {
          throw new Error(`Overlay de '${partyId}' contiene ID inexistente '${overlayPropId}'.`);
        }
      }
    }
    const partyAnnotations = annotationsByParty[partyId];
    if (partyAnnotations) {
      const validIds = new Set(partyProposals.map((p) => p.id));
      for (const annotatedId of Object.keys(partyAnnotations)) {
        if (!validIds.has(annotatedId)) {
          throw new Error(`Anotaciones de '${partyId}' contienen ID inexistente '${annotatedId}'.`);
        }
      }
    }

    // Calcular estadísticas del programa por tema y totales
    const byThemeStats: Record<string, { extracted: number; published: number }> = {};
    for (const theme of taxonomy.themes) {
      byThemeStats[theme.id] = { extracted: 0, published: 0 };
    }

    let publishedCount = 0;
    let requiresReviewCount = 0;
    let rejectedCount = 0;
    let reservedCount = 0;
    let verifiedCount = 0;

    for (const p of partyProposals) {
      const tStat = byThemeStats[p.theme_id] ?? { extracted: 0, published: 0 };
      tStat.extracted += 1;
      if (isProposalPublishable(p)) {
        publishedCount += 1;
        tStat.published += 1;
      }
      if (p.review.status === "requiere_revision") requiresReviewCount += 1;
      if (p.review.status === "rechazada") rejectedCount += 1;
      if (p.kind === "reservada") reservedCount += 1;
      if (p.review.status === "verificada" || p.review.status === "corregida") {
        verifiedCount += 1;
      }
      byThemeStats[p.theme_id] = tStat;
    }

    programs.push({
      ...entry.program,
      stats: {
        extracted: partyProposals.length,
        published: publishedCount,
        requires_review: requiresReviewCount,
        rejected: rejectedCount,
        reserved: reservedCount,
        verified: verifiedCount,
        by_theme: byThemeStats,
      },
    });

    coverageByParty.push({
      party_id: partyId,
      party_name: entry.party.name.value ?? partyId,
      short_name: entry.party.short_name.value ?? partyId.toUpperCase(),
      document_id: sourceDoc.id,
      sha256: sourceDoc.sha256,
      bytes: sourceDoc.bytes,
      page_count: sourceDoc.page_count,
      extraction_tool: sourceDoc.extraction.tool,
      extracted: partyProposals.length,
      published: publishedCount,
      verified: verifiedCount,
      requires_review: requiresReviewCount,
      rejected: rejectedCount,
      reserved: reservedCount,
      match_counts: matchCounts,
    });
  }

  // Validación explícita de las Invariantes 2, 3 y 4 sobre propuestas
  const seenGlobalIds = new Set<string>();
  const seenLegacyByParty = new Map<PartyId, Set<string>>();
  const proposalById = new Map<string, Proposal>();

  for (const proposal of allProposals) {
    if (seenGlobalIds.has(proposal.id)) {
      throw new Error(`Invariante 2 fallida: Proposal.id duplicado '${proposal.id}'.`);
    }
    seenGlobalIds.add(proposal.id);
    proposalById.set(proposal.id, proposal);

    const partyLegacySet = seenLegacyByParty.get(proposal.party_id) ?? new Set<string>();
    if (partyLegacySet.has(proposal.legacy_id)) {
      throw new Error(
        `Invariante 2 fallida: legacy_id duplicado '${proposal.legacy_id}' en partido '${proposal.party_id}'.`,
      );
    }
    partyLegacySet.add(proposal.legacy_id);
    seenLegacyByParty.set(proposal.party_id, partyLegacySet);

    if (isProposalPublishable(proposal)) {
      const hasPage = proposal.evidence.some((e) => e.pages.length > 0);
      if (!hasPage) {
        throw new Error(
          `Invariante 3 fallida: propuesta publicable '${proposal.id}' carece de página de evidencia.`,
        );
      }
      if (hasEditorialBracketAnnotation(proposal.official_text.text)) {
        throw new Error(
          `Invariante 4 fallida: propuesta publicable '${proposal.id}' contiene anotación editorial entre corchetes en official_text.`,
        );
      }
    }
  }

  // Cargar y validar preguntas de encuesta (Invariantes 5, 6, 7 y 8)
  const surveyQuestions = await loadSurveyQuestions();
  for (const q of surveyQuestions) {
    if (!themeById.has(q.theme_id)) {
      throw new Error(`Pregunta '${q.id}' referencia theme_id inexistente '${q.theme_id}'.`);
    }
    if (q.review.status !== "verificada") {
      throw new Error(
        `Invariante 8 fallida: la pregunta publicada '${q.id}' debe tener review.status = 'verificada'.`,
      );
    }

    for (const partyId of ALL_PARTY_IDS) {
      const pos = q.positions[partyId];
      if (!pos) {
        throw new Error(
          `Invariante 5 fallida: falta posición del partido '${partyId}' en '${q.id}'.`,
        );
      }
      if (pos.review.status !== "verificada") {
        throw new Error(
          `Invariante 8 fallida: la posición de '${partyId}' en '${q.id}' debe tener review.status = 'verificada'.`,
        );
      }
      if (pos.status === "posicion" || pos.status === "insuficiente") {
        for (const refId of pos.evidence_proposal_ids) {
          const refProposal = proposalById.get(refId);
          if (!refProposal) {
            throw new Error(
              `Invariante 7 fallida: '${q.id}' (${partyId}) referencia propuesta inexistente '${refId}'.`,
            );
          }
          if (refProposal.party_id !== partyId) {
            throw new Error(
              `Invariante 7 fallida: '${q.id}' (${partyId}) referencia propuesta '${refId}' perteneciente a '${refProposal.party_id}'.`,
            );
          }
          if (!isProposalSurveyEligible(refProposal)) {
            throw new Error(
              `Invariante 7 fallida: la propuesta '${refId}' usada como evidencia en la encuesta ('${q.id}') debe ser publicable y estar verificada/corregida (estado actual: ${refProposal.review.status}).`,
            );
          }
        }
      }
    }
  }

  // Validar dataset completo contra esquema maestro Zod
  const corpusDataset: CorpusDataset = CorpusDatasetSchema.parse({
    schema_version: "1.0.0",
    generated_at: generatedAt,
    election: {
      id: registry.election_id,
      name: registry.election_name,
      date: registry.election_date,
    },
    inputs: {
      pdf_sha256: pdfShaMap,
      review_overlays_loaded: [...loadedOverlayFiles, ...loadedAnnotationFiles],
    },
    parties,
    programs,
    documents,
    themes: taxonomy.themes,
    proposals: allProposals,
  });

  const surveyDataset = SurveyDatasetSchema.parse({
    schema_version: "1.0.0",
    generated_at: generatedAt,
    questions: surveyQuestions,
  });

  // Construir índice MiniSearch exclusivamente con propuestas publicables (incluyendo ai_annotations para desplegable D-006 v1.1)
  const partyMap = new Map(parties.map((p) => [p.id, p]));
  const miniSearch = new MiniSearch<IndexedProposalDoc>({
    fields: MINI_SEARCH_FIELDS,
    storeFields: MINI_SEARCH_STORE_FIELDS,
    tokenize: tokenizeCivicText,
    processTerm: processCivicTerm,
  });

  const publishableDocs: IndexedProposalDoc[] = corpusDataset.proposals
    .filter(isProposalPublishable)
    .map((p) => {
      const party = partyMap.get(p.party_id);
      const theme = themeById.get(p.theme_id);
      const primaryEv = p.evidence[0];
      return {
        id: p.id,
        legacy_id: p.legacy_id,
        party_id: p.party_id,
        party_short_name: party?.short_name.value ?? p.party_id.toUpperCase(),
        party_name: party?.name.value ?? p.party_id,
        theme_id: p.theme_id,
        theme_title: theme?.title ?? p.theme_id,
        title: p.title.text,
        official_text: p.official_text.text,
        language: p.official_text.language,
        original_section: p.original_section.value ?? "",
        review_status: p.review.status,
        is_verified: p.review.status === "verificada" || p.review.status === "corregida",
        pages: primaryEv?.pages ?? [],
        pdf_href: primaryEv?.pdf_href ?? `/pdfs/${p.party_id}.pdf`,
        snippet: primaryEv?.snippet ?? truncateSnippet(p.official_text.text, 280),
        ai_summary: p.ai_annotations.summary,
        ai_arguments_for: p.ai_annotations.arguments_for,
        ai_arguments_against: p.ai_annotations.arguments_against,
        ai_sources_for: p.ai_annotations.sources_for,
        ai_sources_against: p.ai_annotations.sources_against,
        ai_fact_check_status: p.ai_annotations.fact_check.status,
      };
    });

  miniSearch.addAll(publishableDocs);

  // Construir informe de cobertura agregado
  const coverageByTheme: CoverageReport["by_theme"] = {};
  for (const theme of taxonomy.themes) {
    const perParty = {} as Record<PartyId, { extracted: number; published: number }>;
    let themeExtracted = 0;
    let themePublished = 0;

    for (const program of programs) {
      const st = program.stats.by_theme[theme.id] ?? { extracted: 0, published: 0 };
      perParty[program.party_id] = st;
      themeExtracted += st.extracted;
      themePublished += st.published;
    }

    coverageByTheme[theme.id] = {
      extracted: themeExtracted,
      published: themePublished,
      by_party: perParty,
    };
  }

  const coverageReport: CoverageReport = CoverageReportSchema.parse({
    schema_version: "1.0.0",
    generated_at: generatedAt,
    totals: {
      parties: parties.length,
      extracted: allProposals.length,
      published: publishableDocs.length,
      verified: coverageByParty.reduce((acc, p) => acc + p.verified, 0),
      requires_review: coverageByParty.reduce((acc, p) => acc + p.requires_review, 0),
      rejected: coverageByParty.reduce((acc, p) => acc + p.rejected, 0),
      reserved: coverageByParty.reduce((acc, p) => acc + p.reserved, 0),
      survey_questions: surveyQuestions.length,
    },
    by_party: coverageByParty,
    by_theme: coverageByTheme,
  });

  await mkdir(REPORTS_DIR, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(GENERATED_DIR, "corpus.v1.json"),
      JSON.stringify(corpusDataset, null, 2),
      "utf-8",
    ),
    writeFile(
      path.join(GENERATED_DIR, "search-index.v1.json"),
      JSON.stringify(miniSearch.toJSON()),
      "utf-8",
    ),
    writeFile(
      path.join(GENERATED_DIR, "survey.v1.json"),
      JSON.stringify(surveyDataset, null, 2),
      "utf-8",
    ),
    writeFile(
      path.join(REPORTS_DIR, "coverage-report.json"),
      JSON.stringify(coverageReport, null, 2),
      "utf-8",
    ),
    writeFile(
      path.join(REPORTS_DIR, "evidence-report.json"),
      JSON.stringify(
        {
          schema_version: "1.0.0",
          generated_at: generatedAt,
          total: evidenceReportItems.length,
          items: evidenceReportItems,
        },
        null,
        2,
      ),
      "utf-8",
    ),
  ]);

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[data:build] OK en ${(elapsedMs / 1000).toFixed(2)}s — ${parties.length}/${parties.length} SHA-256 verificados | ` +
      `extraídas: ${coverageReport.totals.extracted} | publicables: ${coverageReport.totals.published} | ` +
      `verificadas/corregidas: ${coverageReport.totals.verified} | en revisión: ${coverageReport.totals.requires_review} | ` +
      `reservadas/rechazadas: ${coverageReport.totals.rejected} | preguntas encuesta: ${coverageReport.totals.survey_questions}`,
  );
}

main().catch((err) => {
  console.error("[data:build] ERROR:", err);
  process.exit(1);
});
