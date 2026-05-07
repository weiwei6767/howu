// 四格題 themes — 每個主題 4 個 cell。
// 雙方都選同一格 +30 默契。

export type FourGridTheme = "mood" | "food" | "animal" | "color" | "scene";

export interface FourGridCell {
  emoji: string;
  label_zh: string;
  label_en: string;
}

export const FOUR_GRID_THEMES: Record<FourGridTheme, readonly FourGridCell[]> = {
  mood: [
    { emoji: "😄", label_zh: "輕快", label_en: "Bright" },
    { emoji: "😊", label_zh: "穩定", label_en: "Steady" },
    { emoji: "😔", label_zh: "低落", label_en: "Down" },
    { emoji: "😡", label_zh: "煩躁", label_en: "Edgy" },
  ],
  food: [
    { emoji: "🍜", label_zh: "想吃熱湯", label_en: "Hot soup" },
    { emoji: "🥗", label_zh: "想吃清爽", label_en: "Light" },
    { emoji: "🍔", label_zh: "想吃罪惡", label_en: "Indulgent" },
    { emoji: "🍰", label_zh: "想吃甜的", label_en: "Sweet" },
  ],
  animal: [
    { emoji: "🐱", label_zh: "貓", label_en: "Cat" },
    { emoji: "🐶", label_zh: "狗", label_en: "Dog" },
    { emoji: "🐢", label_zh: "龜", label_en: "Turtle" },
    { emoji: "🦊", label_zh: "狐", label_en: "Fox" },
  ],
  color: [
    { emoji: "🌸", label_zh: "粉", label_en: "Pink" },
    { emoji: "🌅", label_zh: "金", label_en: "Gold" },
    { emoji: "🌊", label_zh: "藍", label_en: "Blue" },
    { emoji: "🌫️", label_zh: "灰", label_en: "Grey" },
  ],
  scene: [
    { emoji: "🏠", label_zh: "在家窩", label_en: "Cozy home" },
    { emoji: "☕", label_zh: "咖啡店", label_en: "Café" },
    { emoji: "🌳", label_zh: "戶外散步", label_en: "Walk outside" },
    { emoji: "✈️", label_zh: "想出去玩", label_en: "Go somewhere" },
  ],
};

/** 用 (couple_id, date) 為 seed 產出今日 theme,雙方看到同一個 */
export function todayTheme(coupleId: string, dateISO: string): FourGridTheme {
  const themes: FourGridTheme[] = ["mood", "food", "animal", "color", "scene"];
  let h = 2166136261;
  const s = `${coupleId}::${dateISO}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return themes[(h >>> 0) % themes.length];
}
