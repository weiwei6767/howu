// 給使用者建模板時的「其他人都這樣寫」建議。
// 不從 DB 撈,直接 hardcode 一些被驗證過好用的題目,
// 以及它們在情侶圈的「常見度」%(編造的範圍合理就好,讓 UI 更有溫度)。

export type SuggestionType =
  | "slider"
  | "multi_choice"
  | "short_text"
  | "guess_partner"
  | "mood_tags";

export interface QuestionSuggestion {
  type: SuggestionType;
  text: string;
  options?: string[];
  /** 多少 % 情侶會在問卷裡放這題(假數字,只是用來引導) */
  popularity: number;
  category?: "心情" | "感謝" | "觀察" | "未來" | "親密" | "時光" | "玩";
}

export const QUESTION_SUGGESTIONS: readonly QuestionSuggestion[] = [
  // ── 心情
  { type: "slider", text: "今日幸福程度", popularity: 92, category: "心情" },
  { type: "slider", text: "今天累的程度", popularity: 88, category: "心情" },
  { type: "slider", text: "今天的壓力指數", popularity: 71, category: "心情" },
  { type: "mood_tags", text: "今天的心情", popularity: 80, category: "心情" },
  { type: "short_text", text: "用一個詞形容今天", popularity: 64, category: "心情" },

  // ── 感謝
  { type: "short_text", text: "今天最想對對方說的一句話", popularity: 78, category: "感謝" },
  { type: "short_text", text: "今天最讓我感謝對方的一件事", popularity: 75, category: "感謝" },
  { type: "short_text", text: "今天對方做的哪件事讓你心暖?", popularity: 60, category: "感謝" },

  // ── 觀察
  { type: "guess_partner", text: "猜對方今天的幸福分數", popularity: 86, category: "觀察" },
  { type: "guess_partner", text: "猜對方今天的累指數", popularity: 81, category: "觀察" },
  {
    type: "multi_choice",
    text: "對方今天的氣場?",
    options: ["陽光", "冷靜", "煩躁", "若有所思", "平淡"],
    popularity: 58,
    category: "觀察",
  },
  { type: "short_text", text: "今天看到對方做了什麼讓你心動?", popularity: 54, category: "觀察" },
  { type: "short_text", text: "今天對方的一句話讓你印象深?", popularity: 48, category: "觀察" },

  // ── 親密
  { type: "slider", text: "今天的親密程度", popularity: 49, category: "親密" },
  {
    type: "multi_choice",
    text: "今天的接觸",
    options: ["牽手", "擁抱", "親吻", "靠著", "沒有"],
    popularity: 45,
    category: "親密",
  },
  { type: "slider", text: "想念對方的程度", popularity: 67, category: "親密" },

  // ── 時光
  {
    type: "multi_choice",
    text: "今天主要做了哪件事?",
    options: ["休息充電", "跟朋友見面", "認真工作", "跑外面", "跟對方一起"],
    popularity: 70,
    category: "時光",
  },
  { type: "slider", text: "共度時間滿意度", popularity: 56, category: "時光" },
  { type: "short_text", text: "今天跟對方一起做了什麼?", popularity: 62, category: "時光" },

  // ── 未來
  { type: "short_text", text: "希望明天能跟對方一起做的事", popularity: 38, category: "未來" },
  { type: "short_text", text: "想跟對方計劃的下一件事", popularity: 31, category: "未來" },

  // ── 玩 / 開放
  { type: "short_text", text: "今天最好笑的瞬間", popularity: 51, category: "玩" },
  { type: "short_text", text: "今天的一首代表歌", popularity: 25, category: "玩" },
  {
    type: "multi_choice",
    text: "今天的我們像什麼天氣?",
    options: ["晴", "多雲", "陣雨", "彩虹", "颱風"],
    popularity: 33,
    category: "玩",
  },
];

export const PROMISE_SUGGESTIONS: readonly { text: string; popularity: number }[] = [
  { text: "看完對方答案不立刻分析,先深呼吸", popularity: 71 },
  { text: "回應對方至少一句話", popularity: 88 },
  { text: "寫完問卷才睡覺", popularity: 65 },
  { text: "如果有心結,當天提出不過夜", popularity: 54 },
  { text: "感謝對方時要寫具體的一件事", popularity: 47 },
  { text: "看到對方寫的負面情緒,先擁抱不解決", popularity: 38 },
];
