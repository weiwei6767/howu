// 輪換題型別 + 範例題目 — 完整 100 題官方題庫見 supabase/seed.sql

export type QuestionCategory =
  | "interaction"
  | "observe"
  | "intimacy"
  | "gratitude"
  | "time"
  | "open";

export type QuestionType = "slider" | "multi_choice" | "short_text" | "guess_partner";

export type RelationshipType = "cohabit" | "same_city" | "long_distance";

export interface RotatingQuestion {
  id: string;
  category: QuestionCategory;
  type: QuestionType;
  text_zh: string;
  text_en: string;
  options_zh?: readonly string[];
  options_en?: readonly string[];
  for_relationship_types: readonly RelationshipType[];
  is_premium?: boolean;
  weight?: number;
}

const ALL: readonly RelationshipType[] = ["cohabit", "same_city", "long_distance"];

export const SAMPLE_ROTATING: readonly RotatingQuestion[] = [
  {
    id: "q_today_quality_time",
    category: "interaction",
    type: "slider",
    text_zh: "今天我們的相處品質",
    text_en: "Quality time we had today",
    for_relationship_types: ALL,
  },
  {
    id: "q_who_initiated_chat",
    category: "interaction",
    type: "multi_choice",
    text_zh: "今天主要是誰開啟對話?",
    text_en: "Who started the conversation today?",
    options_zh: ["我", "對方", "差不多", "今天沒聊"],
    options_en: ["Me", "Partner", "About even", "Didn't talk"],
    for_relationship_types: ALL,
  },
  {
    id: "q_partner_mood_today",
    category: "observe",
    type: "guess_partner",
    text_zh: "猜猜對方今天的心情分數",
    text_en: "Guess your partner's mood today",
    for_relationship_types: ALL,
  },
  {
    id: "q_partner_stress_signal",
    category: "observe",
    type: "multi_choice",
    text_zh: "今天對方有出現什麼壓力訊號?",
    text_en: "Any stress signals from your partner today?",
    options_zh: ["皺眉", "話變少", "滑手機久", "嘆氣", "沒有"],
    options_en: ["Frowning", "Quieter", "On phone a lot", "Sighing", "None"],
    for_relationship_types: ["cohabit", "same_city"],
  },
  {
    id: "q_today_intimacy_level",
    category: "intimacy",
    type: "slider",
    text_zh: "今天的親密程度",
    text_en: "Intimacy today",
    for_relationship_types: ALL,
  },
  {
    id: "q_today_touch",
    category: "intimacy",
    type: "multi_choice",
    text_zh: "今天有哪種接觸?",
    text_en: "What kinds of touch today?",
    options_zh: ["牽手", "擁抱", "親吻", "靠著", "沒有"],
    options_en: ["Holding hands", "Hug", "Kiss", "Leaning", "None"],
    for_relationship_types: ["cohabit", "same_city"],
  },
  {
    id: "q_thanks_today",
    category: "gratitude",
    type: "short_text",
    text_zh: "今天最想謝謝對方什麼?",
    text_en: "What are you most thankful for today?",
    for_relationship_types: ALL,
  },
  {
    id: "q_partner_did_well",
    category: "gratitude",
    type: "multi_choice",
    text_zh: "今天對方做得最好的事?",
    text_en: "What did your partner do best today?",
    options_zh: ["主動關心我", "做家事", "聽我說話", "逗我笑", "支持我的決定"],
    options_en: ["Reached out", "Helped with chores", "Listened", "Made me laugh", "Supported me"],
    for_relationship_types: ALL,
  },
  {
    id: "q_time_satisfaction",
    category: "time",
    type: "slider",
    text_zh: "今天共度時間滿意度",
    text_en: "How satisfied with our time today?",
    for_relationship_types: ALL,
  },
  {
    id: "q_call_frequency",
    category: "time",
    type: "multi_choice",
    text_zh: "今天聯絡頻率",
    text_en: "How often did we connect today?",
    options_zh: ["很多訊息或通話", "幾條訊息", "一兩條", "沒聯絡"],
    options_en: ["A lot", "A few", "One or two", "None"],
    for_relationship_types: ["long_distance"],
  },
  {
    id: "q_open_one_word",
    category: "open",
    type: "short_text",
    text_zh: "用一個詞形容今天的我們",
    text_en: "One word for us today",
    for_relationship_types: ALL,
  },
  {
    id: "q_open_funny_moment",
    category: "open",
    type: "short_text",
    text_zh: "今天最好笑的瞬間",
    text_en: "Funniest moment today",
    for_relationship_types: ALL,
  },
] as const;

export const CATEGORIES: readonly QuestionCategory[] = [
  "interaction",
  "observe",
  "intimacy",
  "gratitude",
  "time",
  "open",
] as const;
