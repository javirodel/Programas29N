import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const ContactPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indica un nombre de al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres."),
  email: z
    .string()
    .trim()
    .email("Introduce un correo electrónico válido.")
    .max(120, "El correo no puede superar los 120 caracteres."),
  category: z.enum(["sugerencia", "correccion", "programa_faltante", "error_tecnico", "otro"]),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más (mínimo 10 caracteres).")
    .max(2000, "El mensaje no puede superar los 2.000 caracteres."),
  website: z.string().max(120).optional().default(""),
});

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 1000) {
    for (const [key, bucket] of rateBuckets.entries()) {
      if (bucket.resetAt <= now) rateBuckets.delete(key);
    }
  }
  const existing = rateBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (existing.count >= RATE_MAX_REQUESTS) {
    return true;
  }
  existing.count += 1;
  return false;
}

function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function escapeForSafeDisplay(input: string): string {
  return input
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .replace(/@/g, "@\u200B")
    .replace(/~~~/g, "~\u200B~~");
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) {
    return true;
  }
  const rawHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (!rawHost) {
    return false;
  }
  try {
    const originHost = new URL(origin).host.toLowerCase();
    return originHost === rawHost.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Formato no permitido." }, { status: 415 });
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > 8192) {
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Has enviado varios mensajes seguidos. Espera unos minutos antes de reintentar." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo JSON no es válido." }, { status: 400 });
  }

  const parsed = ContactPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Revisa los campos del formulario.";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  // Honeypot anti-bots: si viene relleno, respondemos OK silenciosamente sin procesar
  if (parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const sanitized = {
    name: stripControlChars(parsed.data.name),
    email: stripControlChars(parsed.data.email),
    category: parsed.data.category,
    message: stripControlChars(parsed.data.message),
    submittedAt: new Date().toISOString(),
  };

  const safeName = escapeForSafeDisplay(sanitized.name).replace(/[\r\n]+/g, " ");
  const safeEmail = escapeForSafeDisplay(sanitized.email).replace(/[\r\n]+/g, " ");
  const safeMessage = escapeForSafeDisplay(sanitized.message);

  console.info("[/api/contact] Mensaje recibido", {
    category: sanitized.category,
    messageLength: sanitized.message.length,
    submittedAt: sanitized.submittedAt,
  });

  const githubToken = process.env.GITHUB_CONTACT_TOKEN?.trim();
  const githubRepo = process.env.GITHUB_CONTACT_REPO?.trim() || "javirodel/Programas29N";
  if (githubToken && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Programa29N-Contact",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: `[Buzón 29N · ${sanitized.category}] ${safeName}`,
          body: [
            `- **Nombre:** ${safeName}`,
            `- **Correo:** \`${safeEmail}\``,
            `- **Motivo:** \`${sanitized.category}\``,
            `- **Fecha:** \`${sanitized.submittedAt}\``,
            "",
            "~~~text",
            safeMessage,
            "~~~",
          ].join("\n"),
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!ghRes.ok) {
        const errBody = await ghRes.text().catch(() => "");
        console.error(
          `[/api/contact] Error al guardar Issue en GitHub (${ghRes.status}):`,
          errBody.slice(0, 300),
        );
      }
    } catch (err) {
      console.error("[/api/contact] Error de red al crear Issue en GitHub:", err);
    }
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (webhookUrl && webhookUrl.startsWith("https://")) {
    try {
      const whRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: "Programa29N",
          content: `**[Programa29N · ${sanitized.category}]** ${safeName} (${safeEmail}):\n~~~text\n${safeMessage}\n~~~`,
          ...sanitized,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!whRes.ok) {
        const errBody = await whRes.text().catch(() => "");
        console.error(`[/api/contact] Error en webhook (${whRes.status}):`, errBody.slice(0, 300));
      }
    } catch (err) {
      console.error("[/api/contact] Error al reenviar al webhook:", err);
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const contactToEmail = process.env.CONTACT_TO_EMAIL?.trim();
  if (resendApiKey && contactToEmail) {
    try {
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL?.trim() || "Programa29N <onboarding@resend.dev>",
          to: [contactToEmail],
          reply_to: sanitized.email,
          subject: `[Programa29N · ${sanitized.category}] Mensaje de ${safeName}`,
          text: `Nombre: ${sanitized.name}\nCorreo: ${sanitized.email}\nMotivo: ${sanitized.category}\nFecha: ${sanitized.submittedAt}\n\n${sanitized.message}`,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!mailRes.ok) {
        const errBody = await mailRes.text().catch(() => "");
        console.error(
          `[/api/contact] Error al enviar correo con Resend (${mailRes.status}):`,
          errBody.slice(0, 300),
        );
      }
    } catch (err) {
      console.error("[/api/contact] Error al enviar correo con Resend:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
