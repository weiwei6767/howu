// 模板建議題庫 — 只剩日常題,question type 只支援 slider 與 short_text
// popularity 是引導用的假百分比,只是視覺提示,不是真實統計。

export type SuggestionType = "slider" | "short_text";

export type SuggestionCategory = "daily";

export interface QuestionSuggestion {
  type: SuggestionType;
  text: string;
  popularity: number;
  category: SuggestionCategory;
}

// ═════════════════════════ 日常題
const DAILY: QuestionSuggestion[] = [
  { type: "slider", text: "今日幸福程度", popularity: 92, category: "daily" },
  { type: "slider", text: "今日的壓力指數", popularity: 78, category: "daily" },
  { type: "slider", text: "今日好心情指數", popularity: 84, category: "daily" },
  { type: "slider", text: "想念對方的程度", popularity: 81, category: "daily" },
  { type: "short_text", text: "今天不開心的地方", popularity: 64, category: "daily" },
  { type: "short_text", text: "今天不滿意的地方", popularity: 60, category: "daily" },
  { type: "short_text", text: "用一個字形容今天", popularity: 70, category: "daily" },
  { type: "short_text", text: "今天最想對對方說的一句話", popularity: 88, category: "daily" },
  { type: "short_text", text: "今天最感謝對方的一件事", popularity: 82, category: "daily" },
  { type: "short_text", text: "今天最印象深刻的瞬間", popularity: 76, category: "daily" },
];

export const QUESTION_SUGGESTIONS: readonly QuestionSuggestion[] = [...DAILY];

export const PROMISE_SUGGESTIONS: readonly { text: string; popularity: number }[] = [
  { text: "看完對方答案不立刻分析,先深呼吸", popularity: 71 },
  { text: "回應對方至少一句話", popularity: 88 },
  { text: "寫完問卷才睡覺", popularity: 65 },
  { text: "如果有心結,當天提出不過夜", popularity: 54 },
  { text: "感謝對方時要寫具體的一件事", popularity: 47 },
  { text: "看到對方寫的負面情緒,先擁抱不解決", popularity: 38 },
];
