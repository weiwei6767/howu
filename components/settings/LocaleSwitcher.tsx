"use client";

import { useTranslations } from "next-intl";

const LOCALES = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
] as const;

interface Props {
  value: string;
  onChange: (locale: string) => void;
}

export function LocaleSwitcher({ value, onChange }: Props) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-ink-mid)]">
        {t("settings.language_label")}
      </span>
      <div className="flex gap-2">
        {LOCALES.map((l) => {
          const active = value === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onChange(l.code)}
              className={`flex-1 py-2 text-sm rounded-[var(--radius-button)] border transition-colors ${
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)] hover:border-[var(--color-ink-mid)]"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
