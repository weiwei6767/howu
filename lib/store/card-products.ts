// 客製卡片 / 紀念品產品目錄。
// price_twd 包含台灣免運;海外另計。
// expedited_extra_twd:24h 急件加價(Phase 3 規格)。

export type CardProductId =
  | "memory_postcard"
  | "year_calendar"
  | "anniversary_book"
  | "sync_poster"
  | "milestone_pin";

export interface CardProduct {
  id: CardProductId;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  base_price_twd: number;
  expedited_extra_twd: number;
  emoji: string;
  /** 用戶可選的客製欄位 */
  fields: ReadonlyArray<"display_name_a" | "display_name_b" | "together_since" | "extra_note">;
  /** 是否含實體運送 */
  physical: boolean;
}

export const CARD_PRODUCTS: readonly CardProduct[] = [
  {
    id: "memory_postcard",
    name_zh: "回憶明信片",
    name_en: "Memory Postcard",
    description_zh: "一張 A6 雙面卡,正面 D-Day 與你們名字,背面今年最常出現的 6 個心情標籤。",
    description_en: "A6 double-sided. Front: D-Day & names. Back: top mood tags of the year.",
    base_price_twd: 199,
    expedited_extra_twd: 99,
    emoji: "💌",
    fields: ["display_name_a", "display_name_b", "extra_note"],
    physical: true,
  },
  {
    id: "year_calendar",
    name_zh: "我們的年曆",
    name_en: "Our Year Calendar",
    description_zh: "12 個月份,每月顯示你們的默契等級成長,封面客製 D-Day 與紀念日。",
    description_en: "12 months, each showing your sync level. Cover with D-Day & milestones.",
    base_price_twd: 599,
    expedited_extra_twd: 199,
    emoji: "📅",
    fields: ["display_name_a", "display_name_b", "together_since", "extra_note"],
    physical: true,
  },
  {
    id: "anniversary_book",
    name_zh: "週年紀念書(精裝)",
    name_en: "Anniversary Book (Hardcover)",
    description_zh: "把這一年所有問卷數據、共同相簿、悄悄話封存印成一本精裝書。",
    description_en: "Hardcover book with this year's check-ins, photos, whispers.",
    base_price_twd: 1290,
    expedited_extra_twd: 399,
    emoji: "📖",
    fields: ["display_name_a", "display_name_b", "together_since", "extra_note"],
    physical: true,
  },
  {
    id: "sync_poster",
    name_zh: "默契值海報",
    name_en: "Sync Poster",
    description_zh: "A3 海報印你們默契樹當前等級 + 默契值成長曲線。",
    description_en: "A3 poster: your sync tree at current level + growth curve.",
    base_price_twd: 350,
    expedited_extra_twd: 150,
    emoji: "🌳",
    fields: ["display_name_a", "display_name_b"],
    physical: true,
  },
  {
    id: "milestone_pin",
    name_zh: "紀念日金屬別針",
    name_en: "Milestone Pin",
    description_zh: "金屬鍍金別針,刻你們的 D-Day 數字。",
    description_en: "Gold-plated metal pin engraved with your D-Day number.",
    base_price_twd: 450,
    expedited_extra_twd: 200,
    emoji: "📌",
    fields: ["together_since"],
    physical: true,
  },
] as const;

export function getCardProduct(id: string): CardProduct | undefined {
  return CARD_PRODUCTS.find((p) => p.id === id);
}
