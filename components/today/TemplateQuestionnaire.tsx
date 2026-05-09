"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Textarea } from "@/components/ui/Input";
import { MoodTags } from "@/components/questionnaire/MoodTags";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

type AnswerValue = number | string | string[] | null;

interface Question {
  id: string;
  position: number;
  type: string;
  text: string;
  options: string[] | null;
}

interface PromiseRow {
  id: string;
  position: number;
  text: string;
}

interface Props {
  coupleId: string;
  userId: string;
  date: string;
  templateId: string;
  questions: Question[];
  promises: PromiseRow[];
  moodTagOptions: string[] | null;
  locale: string;
}

export function TemplateQuestionnaire({
  coupleId,
  userId,
  date,
  templateId,
  questions,
  promises,
  moodTagOptions,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [moodPicks, setMoodPicks] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const showMood = !!moodTagOptions && moodTagOptions.length > 0;

  function setAnswer(qid: string, v: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const rotating_answers = questions.map((q) => ({
        question_id: q.id,
        type: q.type,
        text: q.text,
        value: answers[q.id] ?? null,
      }));

      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("daily_responses").insert({
        couple_id: coupleId,
        responder_id: userId,
        date,
        template_id: templateId,
        rotating_answers,
        mood_tags: moodPicks,
      });
      if (error) {
        toast(error.message, { tone: "error" });
        return;
      }
      toast(t("questionnaire.submitted_title"), { tone: "success" });

      // fire-and-forget 推播通知對方:對方還沒寫的話會收到「換你了」
      fetch("/api/push/notify-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "partner_completed" }),
      }).catch(() => {
        // 通知失敗不影響使用流程
      });

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-7"
    >
      {promises.length > 0 && (
        <section className="rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-accent-soft)]/30 border border-[var(--color-accent)]/30 px-4 py-3.5 shadow-[0_2px_8px_-3px_rgba(184,50,77,0.18)]">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent-deep)] flex items-center gap-1.5">
            <span>✦</span>
            {t("questionnaire.section_promises")}
          </h3>
          <ul className="flex flex-col gap-1 mt-2">
            {promises.map((p) => (
              <li
                key={p.id}
                className="text-sm leading-relaxed text-[var(--color-ink)] flex items-baseline gap-2"
              >
                <span className="text-[var(--color-accent)] shrink-0">·</span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showMood && (
        <section>
          <header className="flex items-baseline gap-3 mb-3">
            <span className="font-serif text-sm text-[var(--color-ink-soft)]">
              ✦
            </span>
            <h3 className="text-[15px] leading-snug flex-1 text-[var(--color-ink)] font-medium">
              今天的心情
            </h3>
          </header>
          <MoodTags
            values={moodPicks}
            onChange={setMoodPicks}
            available={moodTagOptions}
          />
        </section>
      )}

      <div className="flex flex-col gap-8">
        {questions.map((q, i) => (
          <QuestionField
            key={q.id}
            index={i + 1}
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))}
      </div>

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {t("questionnaire.submit_finish")}
      </Button>
    </form>
  );
}

function QuestionField({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  const t = useTranslations();
  const head = (
    <header className="flex items-baseline gap-3 mb-3">
      <span className="font-serif text-sm text-[var(--color-ink-soft)] tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="text-[15px] leading-snug flex-1 text-[var(--color-ink)]">
        {question.text}
      </h3>
    </header>
  );

  if (question.type === "slider" || question.type === "guess_partner") {
    return (
      <section>
        {head}
        <Slider
          value={typeof value === "number" ? value : 5}
          onChange={(v) => onChange(v)}
        />
        {question.type === "guess_partner" && (
          <p className="text-xs text-[var(--color-ink-soft)] mt-2">
            {t("today_completed.guess_partner_hint")}
          </p>
        )}
      </section>
    );
  }
  if (question.type === "multi_choice") {
    const options = question.options ?? [];
    const selected = Array.isArray(value) ? value : [];
    return (
      <section>
        {head}
        <div className="flex flex-wrap gap-2">
          {options.map((opt, i) => {
            const active = selected.includes(opt);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const next = active
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt];
                  onChange(next);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                    : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </section>
    );
  }
  if (question.type === "mood_tags") {
    return (
      <section>
        {head}
        <MoodTags
          values={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(v)}
          available={question.options ?? null}
        />
      </section>
    );
  }
  if (question.type === "letter") {
    const text = typeof value === "string" ? value : "";
    return (
      <section>
        {head}
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("questionnaire.letter_placeholder")}
          className="text-base leading-relaxed"
          style={{ fontFamily: "var(--font-handwritten)", fontSize: "1.1rem" }}
        />
        <p className="text-xs text-[var(--color-ink-soft)] text-right mt-1 tabular-nums">
          {text.length}
        </p>
      </section>
    );
  }
  return (
    <section>
      {head}
      <Textarea
        rows={2}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("questionnaire.short_text_placeholder")}
      />
    </section>
  );
}
