"use client";

import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/Slider";
import { FIXED_QUESTIONS, type FixedAnswers, type FixedQuestionId } from "@/lib/questions/fixed";

interface Props {
  values: FixedAnswers;
  onChange: (values: FixedAnswers) => void;
}

export function FixedSection({ values, onChange }: Props) {
  const t = useTranslations();
  return (
    <section className="flex flex-col gap-5">
      {FIXED_QUESTIONS.map((q) => (
        <Slider
          key={q.id}
          label={t(q.i18nKey)}
          value={values[q.id]}
          gradient={q.gradient}
          reverse={q.reverse}
          onChange={(v) => onChange({ ...values, [q.id as FixedQuestionId]: v })}
        />
      ))}
    </section>
  );
}
