"use client";

import { moodLabel } from "@/lib/moods";
import { useTranslations } from "next-intl";

// 預設 5 個 + 推薦 3 個 = 共 8 個情緒
const DEFAULT_TAGS = ["開心", "六六大順", "心煩", "低氣壓", "平常心"] as const;
const RECOMMENDED_TAGS = ["平靜", "感謝", "累"] as const;
const ALL_TAGS = [...DEFAULT_TAGS, ...RECOMMENDED_TAGS] as const;

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
}

export function MoodTags({ values, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map((key) => {
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
