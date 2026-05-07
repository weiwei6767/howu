// 每日選題演算法 — 對應 CLAUDE.md §5.2
// 規則:
//   1. 從 6 大類別各抽 1 題
//   2. 同題 14 天內不重複(由呼叫端傳 excludeIds)
//   3. 短文字題每天最多 2 題
//   4. 過濾 relationship_type 不符的題
//   5. Premium couple 才能拿到 is_premium = true 的題
//   6. 同 couple 兩人看到同一份題:用 (couple_id, date) 為 seed

import {
  CATEGORIES,
  type QuestionCategory,
  type RelationshipType,
  type RotatingQuestion,
} from "./rotating";

function hashSeed(coupleId: string, dateISO: string): number {
  let h = 2166136261;
  const s = `${coupleId}::${dateISO}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface SelectArgs {
  pool: readonly RotatingQuestion[];
  excludeIds: ReadonlySet<string>;
  relationshipType: RelationshipType;
  isPremiumCouple: boolean;
  coupleId: string;
  dateISO: string;
  maxShortText?: number;
}

export function selectTodayQuestions({
  pool,
  excludeIds,
  relationshipType,
  isPremiumCouple,
  coupleId,
  dateISO,
  maxShortText = 2,
}: SelectArgs): RotatingQuestion[] {
  const rng = mulberry32(hashSeed(coupleId, dateISO));

  const eligible = pool.filter(
    (q) =>
      !excludeIds.has(q.id) &&
      q.for_relationship_types.includes(relationshipType) &&
      (!q.is_premium || isPremiumCouple),
  );

  const byCategory = new Map<QuestionCategory, RotatingQuestion[]>();
  for (const cat of CATEGORIES) byCategory.set(cat, []);
  for (const q of eligible) byCategory.get(q.category)?.push(q);

  const picked: RotatingQuestion[] = [];
  let shortTextCount = 0;

  for (const cat of CATEGORIES) {
    const candidates = shuffleSeeded(byCategory.get(cat) ?? [], rng);
    let chosen: RotatingQuestion | undefined;
    for (const q of candidates) {
      if (q.type === "short_text" && shortTextCount >= maxShortText) continue;
      chosen = q;
      break;
    }
    if (chosen) {
      picked.push(chosen);
      if (chosen.type === "short_text") shortTextCount++;
    }
  }

  return picked;
}
