import assert from "node:assert/strict";
import test from "node:test";
import { getParties, getSurveyQuestions, getThemes } from "../src/modules/corpus/repository.ts";
import { calculateSurveyAffinity } from "../src/modules/survey/calculator.ts";

test("la fórmula D-012 calcula 100% en coincidencia total y 0% en oposición máxima", async () => {
  const [questions, parties, themes] = await Promise.all([
    getSurveyQuestions(),
    getParties(),
    getThemes(),
  ]);

  const firstQuestion = questions[0];
  assert.ok(firstQuestion);

  // Pregunta q-vivienda-01: PP tiene -2, BNG tiene +2, FO tiene sin_referencia
  const outputBngMax = calculateSurveyAffinity({
    questions,
    parties,
    themes,
    answers: { [firstQuestion.id]: 2 },
  });

  const bngResult = outputBngMax.results.find((r) => r.partyId === "bng");
  const ppResult = outputBngMax.results.find((r) => r.partyId === "pp");
  const foResult = outputBngMax.results.find((r) => r.partyId === "frente-obrero");

  assert.equal(bngResult?.affinityPercent, 100);
  assert.equal(bngResult?.comparableQuestionsCount, 1);

  assert.equal(ppResult?.affinityPercent, 0);
  assert.equal(ppResult?.comparableQuestionsCount, 1);

  // El silencio no inventa puntuación ni penaliza el denominador comparable
  assert.equal(foResult?.affinityPercent, null);
  assert.equal(foResult?.comparableQuestionsCount, 0);
  assert.equal(foResult?.insufficientOrMissingCount, 1);
});

test("omitir preguntas con 'skip' excluye la cuestión de todas las candidaturas", async () => {
  const [questions, parties, themes] = await Promise.all([
    getSurveyQuestions(),
    getParties(),
    getThemes(),
  ]);

  const answers = Object.fromEntries(questions.map((q) => [q.id, "skip" as const]));
  const output = calculateSurveyAffinity({ questions, parties, themes, answers });

  assert.equal(output.answeredCount, 0);
  assert.equal(output.skippedCount, questions.length);
  for (const res of output.results) {
    assert.equal(res.affinityPercent, null);
    assert.equal(res.comparableQuestionsCount, 0);
    assert.equal(res.coveragePercent, 0);
  }
});
