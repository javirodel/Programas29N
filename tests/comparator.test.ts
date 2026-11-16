import assert from "node:assert/strict";
import test from "node:test";
import { buildComparisonMatrix, EMPTY_BLOCK_NOTICE } from "../src/modules/comparator/matrix.ts";
import { getParties, getPublishedProposals, getThemes } from "../src/modules/corpus/repository.ts";

test("buildComparisonMatrix limita a 4 partidos y explicita bloques sin propuestas", async () => {
  const [parties, themes, proposals] = await Promise.all([
    getParties(),
    getThemes(),
    getPublishedProposals(),
  ]);

  const matrix = buildComparisonMatrix({
    selectedPartyIds: ["pp", "bng", "salf", "pnv", "partido-humanista"],
    parties,
    themes,
    proposals,
    hideEmptyThemes: false,
  });

  assert.equal(matrix.selectedParties.length, 4);
  assert.equal(matrix.rows.length, themes.length);

  // SALF no tiene medidas registradas en energía según el corpus auditado
  const energyRow = matrix.rows.find((r) => r.theme.id === "energia");
  assert.ok(energyRow);
  const salfCell = energyRow.cells.salf;
  assert.equal(salfCell.count, 0);
  assert.equal(salfCell.emptyMessage, EMPTY_BLOCK_NOTICE);
});
