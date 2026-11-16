import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDFS_DIR = path.resolve(process.cwd(), "pdfs_originales");
const SAFE_PDF_FILENAME_REGEX = /^[A-Za-z0-9_-]+\.pdf$/;

interface RouteContext {
  params: Promise<{
    filename: string;
  }>;
}

interface ByteRange {
  start: number;
  end: number;
}

function parseByteRange(rangeHeader: string, fileSize: number): ByteRange | "unsatisfiable" | null {
  if (!rangeHeader.startsWith("bytes=") || fileSize <= 0) {
    return null;
  }

  const spec = rangeHeader.slice("bytes=".length).trim();
  // Si se solicitan múltiples rangos, devolvemos el documento completo (200 OK) según RFC 9110.
  if (spec.includes(",")) {
    return null;
  }

  const [rawStart, rawEnd] = spec.split("-", 2);
  if (rawStart === undefined || rawEnd === undefined) {
    return null;
  }

  if (rawStart === "" && rawEnd === "") {
    return "unsatisfiable";
  }

  if (rawStart === "") {
    const suffixLength = Number.parseInt(rawEnd, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return "unsatisfiable";
    }
    const start = Math.max(0, fileSize - suffixLength);
    return { start, end: fileSize - 1 };
  }

  const start = Number.parseInt(rawStart, 10);
  if (!Number.isFinite(start) || start < 0 || start >= fileSize) {
    return "unsatisfiable";
  }

  if (rawEnd === "") {
    return { start, end: fileSize - 1 };
  }

  const parsedEnd = Number.parseInt(rawEnd, 10);
  if (!Number.isFinite(parsedEnd) || parsedEnd < start) {
    return "unsatisfiable";
  }

  return {
    start,
    end: Math.min(parsedEnd, fileSize - 1),
  };
}

function resolveSafePdfPath(filename: string): string | null {
  if (!SAFE_PDF_FILENAME_REGEX.test(filename)) {
    return null;
  }

  const resolvedPath = path.resolve(PDFS_DIR, filename);
  const relative = path.relative(PDFS_DIR, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return resolvedPath;
}

function buildBaseHeaders(filename: string, size: number, mtimeMs: number): Headers {
  const etag = `W/"${size.toString(16)}-${Math.trunc(mtimeMs).toString(16)}"`;
  return new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  });
}

async function handlePdfRequest(
  request: NextRequest,
  context: RouteContext,
  includeBody: boolean,
): Promise<Response> {
  const { filename } = await context.params;
  const safePath = resolveSafePdfPath(filename);

  if (!safePath) {
    return NextResponse.json({ error: "Nombre de documento PDF no válido." }, { status: 400 });
  }

  let fileStats;
  try {
    fileStats = await stat(safePath);
  } catch {
    return NextResponse.json({ error: "Documento PDF original no encontrado." }, { status: 404 });
  }

  if (!fileStats.isFile()) {
    return NextResponse.json({ error: "Documento PDF original no encontrado." }, { status: 404 });
  }

  const fileSize = fileStats.size;
  const headers = buildBaseHeaders(filename, fileSize, fileStats.mtimeMs);
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const parsedRange = parseByteRange(rangeHeader, fileSize);

    if (parsedRange === "unsatisfiable") {
      headers.set("Content-Range", `bytes */${fileSize}`);
      return new Response(null, { status: 416, headers });
    }

    if (parsedRange) {
      const { start, end } = parsedRange;
      const chunkLength = end - start + 1;
      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      headers.set("Content-Length", String(chunkLength));

      if (!includeBody) {
        return new Response(null, { status: 206, headers });
      }

      const nodeStream = createReadStream(safePath, { flags: "r", start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
      return new Response(webStream, { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(fileSize));

  if (!includeBody) {
    return new Response(null, { status: 200, headers });
  }

  const nodeStream = createReadStream(safePath, { flags: "r" });
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return new Response(webStream, { status: 200, headers });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return handlePdfRequest(request, context, true);
}

export async function HEAD(request: NextRequest, context: RouteContext): Promise<Response> {
  return handlePdfRequest(request, context, false);
}
