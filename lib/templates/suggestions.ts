// 模板建議題庫 — 分兩類:日常題 + 寫信給對方(letter)
// popularity 是手寫的「假百分比」,只是引導感,不是真實數據。

export type SuggestionType =
  | "slider"
  | "multi_choice"
  | "short_text"
  | "guess_partner"
  | "mood_tags"
  | "letter";

export type SuggestionCategory = "daily" | "letter";

export interface QuestionSuggestion {
  type: SuggestionType;
  text: string;
  options?: string[];
  popularity: number;
  category: SuggestionCategory;
}

// ═════════════════════════ 日常題(快速 + 結構化)
const DAILY: QuestionSuggestion[] = [
  { type: "slider", text: "今日幸福程度", popularity: 92, category: "daily" },
  { type: "slider", text: "今天累的程度", popularity: 88, category: "daily" },
  { type: "slider", text: "今天的壓力指數", popularity: 71, category: "daily" },
  { type: "mood_tags", text: "今天的心情", popularity: 80, category: "daily" },
  { type: "guess_partner", text: "猜對方今天的幸福分數", popularity: 86, category: "daily" },
  { type: "guess_partner", text: "猜對方今天的累指數", popularity: 81, category: "daily" },
  { type: "short_text", text: "今天最想對對方說的一句話", popularity: 78, category: "daily" },
  { type: "short_text", text: "今天最讓我感謝對方的一件事", popularity: 75, category: "daily" },
  { type: "short_text", text: "今天最好笑的瞬間", popularity: 51, category: "daily" },
  { type: "slider", text: "想念對方的程度", popularity: 67, category: "daily" },
  { type: "slider", text: "今天的親密程度", popularity: 49, category: "daily" },
  {
    type: "multi_choice",
    text: "今天主要做了哪件事?",
    options: ["休息充電", "跟朋友見面", "認真工作", "跑外面", "跟對方一起"],
    popularity: 70,
    category: "daily",
  },
  {
    type: "multi_choice",
    text: "對方今天的氣場?",
    options: ["陽光", "冷靜", "煩躁", "若有所思", "平淡"],
    popularity: 58,
    category: "daily",
  },
  {
    type: "multi_choice",
    text: "今天的接觸",
    options: ["牽手", "擁抱", "親吻", "靠著", "沒有"],
    popularity: 45,
    category: "daily",
  },
  { type: "short_text", text: "用一個詞形容今天", popularity: 64, category: "daily" },
  { type: "short_text", text: "今天看到對方做了什麼讓你心動?", popularity: 54, category: "daily" },
];

// ═════════════════════════ 寫信給對方(letter,長文格式)
// 痛點:情侶常常想寫小作文,結果留在 LINE 聊天室或 IG DM 散失。
// howu 把它存下來,日後可以翻回來看。
const LETTER: QuestionSuggestion[] = [
  {
    type: "letter",
    text: "今天想跟你說的長話",
    popularity: 84,
    category: "letter",
  },
  {
    type: "letter",
    text: "我最近最想感謝你的一件事(寫長一點)",
    popularity: 73,
    category: "letter",
  },
  {
    type: "letter",
    text: "如果今天可以重來,我會...",
    popularity: 58,
    category: "letter",
  },
  {
    type: "letter",
    text: "三年後的我們,我希望是這樣",
    popularity: 51,
    category: "letter",
  },
  {
    type: "letter",
    text: "我們之間我最珍惜的小事",
    popularity: 67,
    category: "letter",
  },
  {
    type: "letter",
    text: "對你的告白 / 想說很久但沒說的話",
    popularity: 62,
    category: "letter",
  },
  {
    type: "letter",
    text: "如果你正在難過,我想跟你說...",
    popularity: 49,
    category: "letter",
  },
  {
    type: "letter",
    text: "這週看到你做的最讓我感動的一件事",
    popularity: 56,
    category: "letter",
  },
];

export const QUESTION_SUGGESTIONS: readonly QuestionSuggestion[] = [...DAILY, ...LETTER];

export const PROMISE_SUGGESTIONS: readonly { text: string; popularity: number }[] = [
  { text: "看完對方答案不立刻分析,先深呼吸", popularity: 71 },
  { text: "回應對方至少一句話", popularity: 88 },
  { text: "寫完問卷才睡覺", popularity: 65 },
  { text: "如果有心結,當天提出不過夜", popularity: 54 },
  { text: "感謝對方時要寫具體的一件事", popularity: 47 },
  { text: "看到對方寫的負面情緒,先擁抱不解決", popularity: 38 },
];
