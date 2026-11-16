import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), ".generated", "reports", "coverage-report.json");
  const content = await readFile(filePath, "utf-8");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'inline; filename="respaldo_auditoria_29N.json"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
