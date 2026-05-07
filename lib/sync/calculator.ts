// 默契值計算 — 對應 CLAUDE.md §5.3 / 企劃書 §5.2.2
//
// 規則:
//   1-10 滑桿:差距 0 +5 / 差距 1 +2
//   多選題:完全相同 +5 / 至少一個共同 +2
//   猜對方分數:完全猜中 +20 / ±1 +10
//   四格題:同格 +30
//   短文字 v2:AI 相似度 +5–15(本檔不處理)
//
// 防作弊:兩人答案間隔 < 5 秒、同 IP/裝置 → 不計分,在呼叫端攔截。

export type SyncEventSource =
  | "fixed_q"
  | "rotating_q"
  | "guess_partner"
  | "four_grid"
  | "short_text";

export interface SyncDeltaEvent {
  source: SyncEventSource;
  source_detail: Record<string, unknown>;
  delta: number;
}

export function diffSliderDelta(a: number, b: number): number {
  const gap = Math.abs(a - b);
  if (gap === 0) return 5;
  if (gap === 1) return 2;
  return 0;
}

export function multiChoiceDelta(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const sameSize = setA.size === setB.size;
  const isSubset = [...setA].every((v) => setB.has(v));
  if (sameSize && isSubset) return 5;
  if ([...setA].some((v) => setB.has(v))) return 2;
  return 0;
}

export function guessPartnerDelta(guess: number, actual: number): number {
  const gap = Math.abs(guess - actual);
  if (gap === 0) return 20;
  if (gap === 1) return 10;
  return 0;
}

export function fourGridDelta(indexA: number, indexB: number): number {
  return indexA === indexB ? 30 : 0;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000] as const;

export function computeLevel(totalScore: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalScore >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}
