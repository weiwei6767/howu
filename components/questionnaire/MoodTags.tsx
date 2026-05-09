"use client";

import { moodLabel } from "@/lib/moods";
import { useTranslations } from "next-intl";

// Fallback 列表(舊資料、未設定 options 的問題用)
const FALLBACK_TAGS = [
  "開心",
  "六六大順",
  "心煩",
  "低氣壓",
  "平常心",
  "平靜",
  "感謝",
  "累",
  "興奮",
];

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
  /** 該題目的可選心情(從 template_questions.options 來) */
  available?: string[] | null;
}

export function MoodTags({ values, onChange, available }: Props) {
  const t = useTranslations();
  const tags =
    available && available.length > 0 ? available : FALLBACK_TAGS;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((key) => {
        const active = values.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              onChange(active ? values.filter((v) => v !== key) : [...values, key])
            }
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
            }`}
          >
            {moodLabel(key, t)}
          </button>
        );
      })}
    </div>
  );
}
