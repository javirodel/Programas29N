import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  getParties,
  getPublishedProposals,
  getSurveyQuestions,
  loadCorpusDataset,
  loadCoverageReport,
} from "../src/modules/corpus/repository.ts";
import { ALL_PARTY_IDS, isProposalSurveyEligible } from "../src/modules/corpus/schema.ts";

test("el corpus N4 mantiene los invariantes de 21 partidos y 6131 registros", async () => {
  const [corpus, coverage, parties, published] = await Promise.all([
    loadCorpusDataset(),
    loadCoverageReport(),
    getParties(),
    getPublishedProposals(),
  ]);

  assert.equal(parties.length, 21);
  assert.equal(corpus.proposals.length, 6131);
  assert.equal(Object.keys(corpus.inputs.pdf_sha256).length, 21);
  assert.equal(coverage.totals.extracted, 6131);
  assert.equal(coverage.totals.published, published.length);
  assert.equal(coverage.totals.reserved, 8);
  assert.equal(coverage.totals.requires_review, 0);
});

test("las propuestas públicas e índice separan ai_annotations del texto literal (ADR D-006 v1.1)", async () => {
  const published = await getPublishedProposals();
  for (const prop of published) {
    assert.ok(prop.ai_annotations, `${prop.id} debe exponer ai_annotations estructuradas`);
    assert.ok(prop.ai_annotations.summary.length > 0, `${prop.id} requiere summary`);
    assert.ok(prop.ai_annotations.arguments_for.length > 0, `${prop.id} requiere arguments_for`);
    assert.ok(
      prop.ai_annotations.arguments_against.length > 0,
      `${prop.id} requiere arguments_against`,
    );
  }

  const rawIndex = await readFile(
    path.join(process.cwd(), ".generated", "search-index.v1.json"),
    "utf-8",
  );
  assert.ok(rawIndex.includes("ai_arguments_for"));
  assert.ok(rawIndex.includes("ai_arguments_against"));
});

test("BNG preserva idioma gallego, ERC preserva catalán y PH/SALF/PP/VOX/ERC/AA cumplen invariantes", async () => {
  const corpus = await loadCorpusDataset();
  const bngProps = corpus.proposals.filter((p) => p.party_id === "bng");
  assert.ok(bngProps.length > 0);
  assert.ok(bngProps.every((p) => p.official_text.language === "gl"));

  const ercProps = corpus.proposals.filter((p) => p.party_id === "erc");
  assert.equal(ercProps.length, 227);
  assert.ok(ercProps.every((p) => p.official_text.language === "ca"));

  const voxProps = corpus.proposals.filter((p) => p.party_id === "vox");
  assert.equal(voxProps.length, 115);

  const aaProps = corpus.proposals.filter((p) => p.party_id === "adelante-andalucia");
  assert.equal(aaProps.length, 719);

  const phProps = corpus.proposals.filter((p) => p.party_id === "partido-humanista");
  assert.equal(phProps.length, 40);
  assert.ok(
    phProps.every((p) => p.review.status === "corregida" || p.review.status === "verificada"),
  );

  const salfProps = corpus.proposals.filter((p) => p.party_id === "salf");
  assert.equal(salfProps.length, 119);
  assert.ok(
    salfProps.every((p) => p.review.status === "corregida" || p.review.status === "verificada"),
  );

  const ppReserved = corpus.proposals.filter((p) => p.party_id === "pp" && p.kind === "reservada");
  assert.equal(ppReserved.length, 8);

  const psoeProps = corpus.proposals.filter((p) => p.party_id === "psoe");
  assert.equal(psoeProps.length, 500);

  const compromisProps = corpus.proposals.filter((p) => p.party_id === "compromis");
  assert.equal(compromisProps.length, 561);
  assert.ok(compromisProps.every((p) => p.official_text.language === "ca"));

  assert.equal(corpus.proposals.filter((p) => p.party_id === "pacma").length, 400);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "falange").length, 260);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "teruel-existe").length, 140);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "soria-ya").length, 22);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "frente-amplio").length, 908);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "eh-bildu").length, 185);
  assert.equal(corpus.proposals.filter((p) => p.party_id === "podemos").length, 442);
});

test("las 15 preguntas de encuesta codifican los 21 partidos con citas verificadas", async () => {
  const [questions, corpus] = await Promise.all([getSurveyQuestions(), loadCorpusDataset()]);
  const proposalMap = new Map(corpus.proposals.map((p) => [p.id, p]));

  assert.equal(questions.length, 15);
  for (const q of questions) {
    for (const partyId of ALL_PARTY_IDS) {
      const pos = q.positions[partyId];
      assert.ok(pos, `Falta posición de ${partyId} en ${q.id}`);
      for (const pid of pos.evidence_proposal_ids) {
        const ref = proposalMap.get(pid);
        assert.ok(ref, `Propuesta ${pid} no encontrada en corpus`);
        assert.equal(
          isProposalSurveyEligible(ref),
          true,
          `Propuesta ${pid} citada en ${q.id} debe estar verificada o corregida`,
        );
      }
    }
  }
});
