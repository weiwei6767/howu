// 模板建議題庫 — 只剩日常題,question type 只支援 slider 與 short_text
// popularity 是引導用的假百分比,只是視覺提示,不是真實統計。

export type SuggestionType = "slider" | "short_text" | "mood_tags";

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
  { type: "mood_tags", text: "今天的心情", popularity: 90, category: "daily" },
  { type: "short_text", text: "今天不開心的地方", popularity: 64, category: "daily" },
  { type: "short_text", text: "今天不滿意的地方", popularity: 60, category: "daily" },
  { type: "short_text", text: "用一個字形容今天", popularity: 70, category: "daily" },
  { type: "short_text", text: "今天最想對對方說的一句話", popularity: 88, category: "daily" },
  { type: "short_text", text: "今天最感謝對方的一件事", popularity: 82, category: "daily" },
  { type: "short_text", text: "今天最印象深刻的瞬間", popularity: 76, category: "daily" },
];

export const QUESTION_SUGGESTIONS: readonly QuestionSuggestion[] = [...DAILY];

// 小懲罰建議 — 對方那天沒寫今日問卷時要履行的小事
// 未來會支援「指定金額自動扣款給對方」的版本
export const PROMISE_SUGGESTIONS: readonly { text: string; popularity: number }[] = [
  { text: "請對方一杯飲料", popularity: 88 },
  { text: "幫對方按摩 10 分鐘", popularity: 79 },
  { text: "包辦今天的洗碗", popularity: 72 },
  { text: "早餐買對方愛吃的", popularity: 68 },
  { text: "請看一場電影", popularity: 60 },
  { text: "寫一張手寫小卡道歉", popularity: 54 },
  { text: "陪做一件對方想做的事", popularity: 49 },
  { text: "包辦下一次倒垃圾", popularity: 42 },
];
