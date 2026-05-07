"use client";

import { useTranslations } from "next-intl";

const TAG_KEYS = [
  "calm",
  "happy",
  "tired",
  "anxious",
  "loved",
  "proud",
  "lonely",
  "grateful",
  "frustrated",
  "excited",
  "thoughtful",
  "peaceful",
] as const;

export const MOOD_TAG_KEYS = TAG_KEYS;

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
}

export function MoodTags({ values, onChange }: Props) {
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-3">
      <span className="text-sm font-medium">{t("questionnaire.mood.title")}</span>
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
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                active
                  ? "bg-[var(--color-rose-soft)] border-[var(--color-rose)] text-[var(--color-rose)]"
                  : "border-zinc-200 text-zinc-700"
              }`}
            >
              {t(`questionnaire.mood.tags.${key}`)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
