import assert from "node:assert/strict";
import test from "node:test";
import { searchProposals } from "../src/modules/search/engine.ts";

test("searchProposals normaliza diacríticos, separa análisis contextual y filtra por partido y bloque", async () => {
  const viviendaRes = await searchProposals({ q: "alquiler", limit: 25 });
  assert.ok(viviendaRes.total > 5);
  assert.ok(
    viviendaRes.hits.every(
      (h) =>
        typeof h.aiSummary === "string" &&
        h.aiSummary.length > 0 &&
        typeof h.aiArgumentsFor === "string" &&
        h.aiArgumentsFor.length > 0 &&
        typeof h.aiArgumentsAgainst === "string" &&
        h.aiArgumentsAgainst.length > 0,
    ),
  );

  const galiciaRes = await searchProposals({
    q: "alugueiro",
    parties: ["bng"],
  });
  assert.ok(galiciaRes.total > 0);
  assert.ok(galiciaRes.hits.every((h) => h.partyId === "bng"));

  const themedSalf = await searchProposals({
    q: "corrupcion",
    parties: ["salf"],
    themes: ["regeneracion"],
  });
  assert.ok(themedSalf.total > 0);
  assert.ok(themedSalf.hits.every((h) => h.partyId === "salf" && h.themeId === "regeneracion"));
});

test("searchProposals rechaza identificadores de partido inválidos", async () => {
  await assert.rejects(() =>
    // @ts-expect-error prueba negativa deliberada de validación Zod
    searchProposals({ q: "vivienda", parties: ["partido-inexistente"] }),
  );
});
