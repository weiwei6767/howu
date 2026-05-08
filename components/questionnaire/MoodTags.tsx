"use client";

const TAG_KEYS = [
  "平靜",
  "開心",
  "累",
  "焦慮",
  "被愛",
  "驕傲",
  "寂寞",
  "感謝",
  "煩躁",
  "興奮",
  "思緒多",
  "踏實",
] as const;

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
}

export function MoodTags({ values, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_KEYS.map((key) => {
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
            {key}
          </button>
        );
      })}
    </div>
  );
}
