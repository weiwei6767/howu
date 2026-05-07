"use client";

import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/Slider";
import { Textarea } from "@/components/ui/Input";
import type { RotatingQuestion } from "@/lib/questions/rotating";

export type RotatingAnswerValue = number | string | string[];

interface Props {
  questions: readonly RotatingQuestion[];
  values: Record<string, RotatingAnswerValue | null>;
  onChange: (qid: string, value: RotatingAnswerValue) => void;
  locale: string;
}

export function RotatingSection({ questions, values, onChange, locale }: Props) {
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-6">
      {questions.map((q) => {
        const text = locale === "en" ? q.text_en : q.text_zh;
        const options = (locale === "en" ? q.options_en : q.options_zh) ?? [];
        const v = values[q.id];

        if (q.type === "slider") {
          return (
            <Slider
              key={q.id}
              label={text}
              value={typeof v === "number" ? v : 5}
              gradient={{ from: "#ffffff", to: "#C2185B" }}
              onChange={(val) => onChange(q.id, val)}
            />
          );
        }
        if (q.type === "guess_partner") {
          return (
            <div key={q.id} className="flex flex-col gap-2">
              <Slider
                label={text}
                value={typeof v === "number" ? v : 5}
                gradient={{ from: "#ffffff", to: "#FFB300" }}
                onChange={(val) => onChange(q.id, val)}
              />
              <p className="text-xs text-zinc-400">{t("questionnaire.rotating.guess_partner_hint")}</p>
            </div>
          );
        }
        if (q.type === "multi_choice") {
          const selected = Array.isArray(v) ? v : [];
          return (
            <div key={q.id} className="flex flex-col gap-2">
              <span className="text-sm font-medium">{text}</span>
              <div className="flex flex-wrap gap-2">
                {options.map((opt, i) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={`${q.id}-${i}`}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? selected.filter((s) => s !== opt)
                          : [...selected, opt];
                        onChange(q.id, next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        active
                          ? "bg-[var(--color-rose)] border-[var(--color-rose)] text-white"
                          : "border-zinc-200 text-zinc-700 hover:border-[var(--color-rose)]/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        // short_text
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor={`q-${q.id}`}>
              {text}
            </label>
            <Textarea
              id={`q-${q.id}`}
              rows={2}
              placeholder={t("questionnaire.rotating.type_text_placeholder")}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => onChange(q.id, e.target.value)}
            />
          </div>
        );
      })}
    </section>
  );
}
