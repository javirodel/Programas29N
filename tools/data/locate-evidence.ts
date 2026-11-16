export type LocatedMatchQuality = "literal" | "fragmentado" | "parcial" | "no_localizado";

export interface DoclingProvenance {
  page_no?: number;
}

export interface DoclingTextNode {
  self_ref?: string;
  text?: string;
  prov?: DoclingProvenance[];
}

export interface DoclingTableCell {
  text?: string;
  prov?: DoclingProvenance[];
}

export interface DoclingTableNode {
  self_ref?: string;
  prov?: DoclingProvenance[];
  data?: {
    table_cells?: DoclingTableCell[];
  } | null;
}

export interface DoclingDocumentLike {
  texts?: DoclingTextNode[];
  tables?: DoclingTableNode[];
}

export interface IndexedDoclingSegment {
  start: number;
  end: number;
  normText: string;
  rawText: string;
  pageNo: number | null;
  ref: string;
}

export interface DoclingSearchIndex {
  fullNorm: string;
  starts: number[];
  segments: IndexedDoclingSegment[];
}

export interface LocatedEvidenceResult {
  match: LocatedMatchQuality;
  pages: number[];
  snippet: string;
  doclingRefs: string[];
  pdfHref: string;
}

const MAX_SNIPPET_LENGTH = 600;

export function normalizeAlnum(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\u00ad/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function buildDoclingIndex(doc: DoclingDocumentLike): DoclingSearchIndex {
  const segments: IndexedDoclingSegment[] = [];
  const starts: number[] = [];
  const chunks: string[] = [];
  let offset = 0;

  const texts = doc.texts ?? [];
  for (let i = 0; i < texts.length; i++) {
    const node = texts[i];
    if (!node) continue;
    const rawText = (node.text ?? "").trim();
    const normText = normalizeAlnum(rawText);
    if (!normText) continue;

    const pageNo = node.prov?.[0]?.page_no ?? null;
    const ref = node.self_ref ?? `#/texts/${i}`;
    starts.push(offset);
    segments.push({
      start: offset,
      end: offset + normText.length - 1,
      normText,
      rawText,
      pageNo,
      ref,
    });
    chunks.push(normText);
    offset += normText.length;
  }

  const tables = doc.tables ?? [];
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    if (!table) continue;
    const tablePageNo = table.prov?.[0]?.page_no ?? null;
    const ref = table.self_ref ?? `#/tables/${t}`;
    const cells = table.data?.table_cells ?? [];

    for (const cell of cells) {
      const rawText = (cell.text ?? "").trim();
      const normText = normalizeAlnum(rawText);
      if (!normText) continue;

      const pageNo = cell.prov?.[0]?.page_no ?? tablePageNo;
      starts.push(offset);
      segments.push({
        start: offset,
        end: offset + normText.length - 1,
        normText,
        rawText,
        pageNo,
        ref,
      });
      chunks.push(normText);
      offset += normText.length;
    }
  }

  return {
    fullNorm: chunks.join(""),
    starts,
    segments,
  };
}

function findSegmentIndexAt(starts: number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  let best = -1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const midStart = starts[mid] ?? 0;
    if (midStart <= offset) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

export function truncateSnippet(raw: string, maxLength = MAX_SNIPPET_LENGTH): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractSpanMetadata(
  index: DoclingSearchIndex,
  startOffset: number,
  endOffset: number,
): { pages: number[]; snippet: string; doclingRefs: string[] } {
  const startIdx = findSegmentIndexAt(index.starts, startOffset);
  const endIdx = findSegmentIndexAt(index.starts, Math.max(startOffset, endOffset));

  if (startIdx < 0 || endIdx < 0) {
    return { pages: [], snippet: "", doclingRefs: [] };
  }

  const pageSet = new Set<number>();
  const refSet = new Set<string>();
  const textParts: string[] = [];

  const cappedEnd = Math.min(endIdx, startIdx + 24);
  for (let idx = startIdx; idx <= cappedEnd; idx++) {
    const seg = index.segments[idx];
    if (!seg) continue;
    if (seg.pageNo !== null && seg.pageNo > 0) {
      pageSet.add(seg.pageNo);
    }
    if (refSet.size < 12) {
      refSet.add(seg.ref);
    }
    textParts.push(seg.rawText);
  }

  // Asegurar que la página final también conste si el tramo abarcaba más de 24 nodos
  const finalSeg = index.segments[endIdx];
  if (finalSeg?.pageNo && finalSeg.pageNo > 0) {
    pageSet.add(finalSeg.pageNo);
  }

  const pages = [...pageSet].sort((a, b) => a - b);
  return {
    pages,
    snippet: truncateSnippet(textParts.join(" ")),
    doclingRefs: [...refSet],
  };
}

export function locateEvidence(
  index: DoclingSearchIndex,
  documentId: string,
  candidateText: string,
): LocatedEvidenceResult {
  const n = normalizeAlnum(candidateText);
  if (!n) {
    return {
      match: "no_localizado",
      pages: [],
      snippet: "",
      doclingRefs: [],
      pdfHref: `/pdfs/${documentId}.pdf`,
    };
  }

  const exactPos = index.fullNorm.indexOf(n);
  if (exactPos >= 0) {
    const span = extractSpanMetadata(index, exactPos, exactPos + n.length - 1);
    const firstPage = span.pages[0];
    return {
      match: "literal",
      pages: span.pages,
      snippet: span.snippet,
      doclingRefs: span.doclingRefs,
      pdfHref: firstPage ? `/pdfs/${documentId}.pdf#page=${firstPage}` : `/pdfs/${documentId}.pdf`,
    };
  }

  const k = 40;
  if (n.length > 2 * k) {
    const head = n.slice(0, k);
    const tail = n.slice(-k);
    const a = index.fullNorm.indexOf(head);
    const b = index.fullNorm.indexOf(tail);

    if (a >= 0 && b >= 0 && b - a >= 0 && b - a < n.length * 3) {
      const span = extractSpanMetadata(index, a, b + k - 1);
      const firstPage = span.pages[0];
      return {
        match: "fragmentado",
        pages: span.pages,
        snippet: span.snippet,
        doclingRefs: span.doclingRefs,
        pdfHref: firstPage
          ? `/pdfs/${documentId}.pdf#page=${firstPage}`
          : `/pdfs/${documentId}.pdf`,
      };
    }

    if (a >= 0 || b >= 0) {
      const pos = a >= 0 ? a : b;
      const span = extractSpanMetadata(index, pos, pos + k - 1);
      const firstPage = span.pages[0];
      return {
        match: "parcial",
        pages: span.pages,
        snippet: span.snippet,
        doclingRefs: span.doclingRefs,
        pdfHref: firstPage
          ? `/pdfs/${documentId}.pdf#page=${firstPage}`
          : `/pdfs/${documentId}.pdf`,
      };
    }
  } else {
    const prefixLen = Math.max(15, Math.floor(n.length / 2));
    const a = index.fullNorm.indexOf(n.slice(0, prefixLen));
    if (a >= 0) {
      const span = extractSpanMetadata(index, a, a + prefixLen - 1);
      const firstPage = span.pages[0];
      return {
        match: "parcial",
        pages: span.pages,
        snippet: span.snippet,
        doclingRefs: span.doclingRefs,
        pdfHref: firstPage
          ? `/pdfs/${documentId}.pdf#page=${firstPage}`
          : `/pdfs/${documentId}.pdf`,
      };
    }
  }

  return {
    match: "no_localizado",
    pages: [],
    snippet: "",
    doclingRefs: [],
    pdfHref: `/pdfs/${documentId}.pdf`,
  };
}
