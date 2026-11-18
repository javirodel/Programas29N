import assert from "node:assert/strict";
import test from "node:test";
import { getAllPartyAnalytics } from "../src/modules/corpus/repository.ts";

test("getAllPartyAnalytics calcula estadísticas reales y vocabulario TF-IDF para los 21 partidos", async () => {
  const analytics = await getAllPartyAnalytics();

  assert.equal(analytics.length, 21, "Debe haber estadísticas para las 21 candidaturas");

  for (const item of analytics) {
    assert.ok(item.proposalCount > 0, `${item.partyId} debe tener propuestas publicables`);
    assert.ok(item.wordCount > 100, `${item.partyId} debe tener recuento real de palabras`);
    assert.ok(item.readingMinutes >= 1, `${item.partyId} debe calcular tiempo de lectura`);
    assert.ok(item.themeDistribution.length > 0, `${item.partyId} debe desglosar bloques`);
    assert.ok(
      item.distinctiveTerms.length > 0,
      `${item.partyId} debe tener palabras características TF-IDF`,
    );
  }
});
