import type {
  LikertScore,
  Party,
  PartyId,
  PositionStatus,
  SurveyQuestion,
  Theme,
} from "@/modules/corpus/types";

export type UserAnswerValue = LikertScore | "skip";

export type UserAnswersMap = Record<string, UserAnswerValue>;

export interface SurveyQuestionComparison {
  questionId: string;
  statement: string;
  themeId: string;
  themeTitle: string;
  userValue: UserAnswerValue | undefined;
  partyStatus: PositionStatus;
  partyValue: LikertScore | null;
  rationale: string;
  evidenceProposalIds: string[];
  agreementPercent: number | null;
  comparable: boolean;
}

export interface SurveyThemeBreakdown {
  themeId: string;
  themeTitle: string;
  comparableCount: number;
  affinityPercent: number | null;
}

export interface PartyAffinityResult {
  partyId: PartyId;
  partyName: string;
  shortName: string;
  affinityPercent: number | null;
  answeredQuestionsCount: number;
  comparableQuestionsCount: number;
  insufficientOrMissingCount: number;
  coveragePercent: number;
  byTheme: SurveyThemeBreakdown[];
  comparisons: SurveyQuestionComparison[];
}

export interface SurveyCalculationOutput {
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  results: PartyAffinityResult[];
}

export function calculateSurveyAffinity({
  questions,
  parties,
  themes,
  answers,
}: {
  questions: SurveyQuestion[];
  parties: Party[];
  themes: Theme[];
  answers: UserAnswersMap;
}): SurveyCalculationOutput {
  const themeMap = new Map(themes.map((t) => [t.id, t.title]));

  let answeredCount = 0;
  let skippedCount = 0;
  for (const q of questions) {
    const ans = answers[q.id];
    if (ans === "skip" || ans === undefined) {
      skippedCount += 1;
    } else {
      answeredCount += 1;
    }
  }

  const results: PartyAffinityResult[] = parties.map((party) => {
    let scoreSum = 0;
    let comparableCount = 0;
    let insufficientOrMissingCount = 0;
    const themeBuckets = new Map<string, { sum: number; count: number }>();
    const comparisons: SurveyQuestionComparison[] = [];

    for (const question of questions) {
      const userVal = answers[question.id];
      const partyPos = question.positions[party.id];
      const themeTitle = themeMap.get(question.theme_id) ?? question.theme_id;
      const partyStatus: PositionStatus = partyPos?.status ?? "sin_referencia";
      const partyValue = partyPos?.value ?? null;

      let comparable = false;
      let agreementPercent: number | null = null;

      if (userVal !== undefined && userVal !== "skip") {
        if (partyStatus === "posicion" && partyValue !== null) {
          comparable = true;
          const agreement = 1 - Math.abs(userVal - partyValue) / 4;
          scoreSum += agreement;
          comparableCount += 1;
          agreementPercent = Math.round(agreement * 100);

          const bucket = themeBuckets.get(question.theme_id) ?? { sum: 0, count: 0 };
          bucket.sum += agreement;
          bucket.count += 1;
          themeBuckets.set(question.theme_id, bucket);
        } else {
          insufficientOrMissingCount += 1;
        }
      }

      comparisons.push({
        questionId: question.id,
        statement: question.statement,
        themeId: question.theme_id,
        themeTitle,
        userValue: userVal,
        partyStatus,
        partyValue,
        rationale:
          partyPos?.rationale ?? "Sin referencia explícita en el programa electoral oficial.",
        evidenceProposalIds: partyPos?.evidence_proposal_ids ?? [],
        agreementPercent,
        comparable,
      });
    }

    const affinityPercent =
      comparableCount > 0 ? Math.round((scoreSum / comparableCount) * 100) : null;
    const coveragePercent =
      answeredCount > 0 ? Math.round((comparableCount / answeredCount) * 100) : 0;

    const byTheme: SurveyThemeBreakdown[] = questions
      .filter((q, idx, arr) => arr.findIndex((x) => x.theme_id === q.theme_id) === idx)
      .map((q) => {
        const bucket = themeBuckets.get(q.theme_id);
        return {
          themeId: q.theme_id,
          themeTitle: themeMap.get(q.theme_id) ?? q.theme_id,
          comparableCount: bucket?.count ?? 0,
          affinityPercent:
            bucket && bucket.count > 0 ? Math.round((bucket.sum / bucket.count) * 100) : null,
        };
      });

    return {
      partyId: party.id,
      partyName: party.name.value ?? party.id,
      shortName: party.short_name.value ?? party.id.toUpperCase(),
      affinityPercent,
      answeredQuestionsCount: answeredCount,
      comparableQuestionsCount: comparableCount,
      insufficientOrMissingCount,
      coveragePercent,
      byTheme,
      comparisons,
    };
  });

  // Ordenar por afinidad descendente; empates por cobertura documental y orden alfabético
  results.sort((a, b) => {
    const scoreA = a.affinityPercent ?? -1;
    const scoreB = b.affinityPercent ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.comparableQuestionsCount !== a.comparableQuestionsCount) {
      return b.comparableQuestionsCount - a.comparableQuestionsCount;
    }
    return a.partyName.localeCompare(b.partyName, "es");
  });

  return {
    totalQuestions: questions.length,
    answeredCount,
    skippedCount,
    results,
  };
}
