import { NextResponse, type NextRequest } from "next/server";
import { PartyIdSchema } from "@/modules/corpus/schema";
import { searchProposals } from "@/modules/search/engine";

function parseListParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").slice(0, 200);
    const rawParties = parseListParam(sp.get("partido")).slice(0, 25);
    const parties = rawParties
      .map((p) => PartyIdSchema.safeParse(p))
      .filter((r) => r.success)
      .map((r) => r.data);
    const themes = parseListParam(sp.get("bloque"))
      .filter((t) => t.length <= 80)
      .slice(0, 25);
    const limitRaw = Number.parseInt(sp.get("limit") ?? "60", 10);
    const offsetRaw = Number.parseInt(sp.get("offset") ?? "0", 10);

    const result = await searchProposals({
      q,
      parties,
      themes,
      limit: Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 200 ? limitRaw : 60,
      offset: Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[/api/search] Error:", error);
    return NextResponse.json(
      { error: "No se pudo completar la búsqueda en el índice del corpus." },
      { status: 400 },
    );
  }
}
