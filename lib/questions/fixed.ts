// 5 固定題 — 對應 daily_responses 中的固定欄位

export type FixedQuestionId =
  | "happiness"
  | "energy"
  | "stress"
  | "miss_partner"
  | "us_overall";

export interface FixedQuestion {
  id: FixedQuestionId;
  i18nKey: `questionnaire.fixed.${FixedQuestionId}`;
  gradient: { from: string; to: string };
  /** stress 是反向 — 高 = 紅 */
  reverse?: boolean;
}

export const FIXED_QUESTIONS: readonly FixedQuestion[] = [
  {
    id: "happiness",
    i18nKey: "questionnaire.fixed.happiness",
    gradient: { from: "#ffffff", to: "#FFB300" },
  },
  {
    id: "energy",
    i18nKey: "questionnaire.fixed.energy",
    gradient: { from: "#ffffff", to: "#4CAF50" },
  },
  {
    id: "stress",
    i18nKey: "questionnaire.fixed.stress",
    gradient: { from: "#4CAF50", to: "#E53935" },
    reverse: true,
  },
  {
    id: "miss_partner",
    i18nKey: "questionnaire.fixed.miss_partner",
    gradient: { from: "#ffffff", to: "#C2185B" },
  },
  {
    id: "us_overall",
    i18nKey: "questionnaire.fixed.us_overall",
    gradient: { from: "#ffffff", to: "#FFC1CC" },
  },
] as const;

export type FixedAnswers = Record<FixedQuestionId, number>;
