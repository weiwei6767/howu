// Mood tag 中文 → 翻譯 key 對照
// DB 內仍存中文 tag,顯示時依 locale 透過 t() 翻譯。

export const MOOD_TAG_TO_KEY: Record<string, string> = {
  開心: "happy",
  六六大順: "smooth",
  心煩: "frustrated",
  低氣壓: "low",
  平常心: "neutral",
  平靜: "calm",
  感謝: "grateful",
  累: "tired",
  // 舊資料相容
  焦慮: "anxious",
  被愛: "loved",
  驕傲: "proud",
  寂寞: "lonely",
  興奮: "excited",
  思緒多: "thoughtful",
  踏實: "peaceful",
};

/** 給顯示用 — 找得到 key 就走翻譯;找不到就回原字串 */
export function moodLabel(
  tag: string,
  t: (key: string) => string,
): string {
  const key = MOOD_TAG_TO_KEY[tag];
  if (!key) return tag;
  return t(`questionnaire.mood.tags.${key}`);
}
