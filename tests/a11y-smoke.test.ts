import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = luminance(hexToRgb(hexA));
  const l2 = luminance(hexToRgb(hexB));
  const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (bright + 0.05) / (dark + 0.05);
}

test("los tokens de diseño claro y oscuro cumplen WCAG 2.2 AA (>= 4.5:1 en texto normal)", async () => {
  const css = await readFile(
    path.join(process.cwd(), "src", "modules", "ui", "tokens.css"),
    "utf-8",
  );
  assert.ok(
    css.includes("color-scheme: light dark"),
    "tokens.css debe declarar color-scheme: light dark",
  );

  const vars: Record<string, string> = {};
  for (const match of css.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    const name = match[1];
    const hex = match[2];
    if (name && hex) vars[name] = hex;
  }

  for (const suffix of ["light", "dark"] as const) {
    const pairs: Array<[string, string, number]> = [
      [`--color-text-primary-${suffix}`, `--color-bg-canvas-${suffix}`, 4.5],
      [`--color-text-primary-${suffix}`, `--color-bg-surface-${suffix}`, 4.5],
      [`--color-text-secondary-${suffix}`, `--color-bg-canvas-${suffix}`, 4.5],
      [`--color-text-muted-${suffix}`, `--color-bg-surface-${suffix}`, 4.5],
      [`--color-accent-primary-${suffix}`, `--color-bg-surface-${suffix}`, 4.5],
      [`--color-accent-fg-${suffix}`, `--color-accent-primary-${suffix}`, 4.5],
      [`--color-status-verified-fg-${suffix}`, `--color-status-verified-bg-${suffix}`, 4.5],
      [`--color-status-pending-fg-${suffix}`, `--color-status-pending-bg-${suffix}`, 4.5],
      [`--color-status-contra-fg-${suffix}`, `--color-status-contra-bg-${suffix}`, 4.5],
      [`--color-status-neutral-fg-${suffix}`, `--color-status-neutral-bg-${suffix}`, 4.5],
    ];

    for (const [fg, bg, minRatio] of pairs) {
      const fgHex = vars[fg];
      const bgHex = vars[bg];
      assert.ok(fgHex && bgHex, `Falta token ${fg} o ${bg}`);
      const ratio = contrastRatio(fgHex, bgHex);
      assert.ok(
        ratio >= minRatio,
        `Contraste insuficiente (${suffix}) ${fg} (${fgHex}) sobre ${bg} (${bgHex}): ${ratio.toFixed(2)}:1`,
      );
    }
  }
});

test("el layout raíz incluye idioma español, esquema dual claro/oscuro, enlace de salto y estructura semántica", async () => {
  const layout = await readFile(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf-8");
  assert.ok(layout.includes('lang="es"'));
  assert.ok(layout.includes('name="color-scheme"'));
  assert.ok(layout.includes("<SkipToContent"));
  assert.ok(layout.includes('id="contenido-principal"'));
  assert.ok(layout.includes("<main"));
});
