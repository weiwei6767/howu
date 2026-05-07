"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
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
  locale: string;
}

export function TemplateQuestionnaire({
  coupleId,
  userId,
  date,
  templateId,
  questions,
  promises,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);

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
      // template_id 是新欄位,types.ts 還沒含,cast 整體繞過
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("daily_responses").insert({
        couple_id: coupleId,
        responder_id: userId,
        date,
        template_id: templateId,
        rotating_answers,
        mood_tags: [],
      });
      if (error) {
        toast(error.message, { tone: "error" });
        return;
      }
      toast("今天寫完了 ✨", { tone: "success" });
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
      className="flex flex-col gap-5"
    >
      {promises.length > 0 && (
        <Card className="bg-amber-50 border border-amber-200">
          <h3 className="text-sm font-semibold mb-2">這份問卷的承諾</h3>
          <ul className="flex flex-col gap-1">
            {promises.map((p) => (
              <li key={p.id} className="text-sm">🤝 {p.text}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="flex flex-col gap-6">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))}
      </Card>

      <Button type="submit" loading={submitting} fullWidth size="lg">
        完成今日問卷
      </Button>
    </form>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  if (question.type === "slider") {
    return (
      <Slider
        label={question.text}
        value={typeof value === "number" ? value : 5}
        onChange={(v) => onChange(v)}
      />
    );
  }
  if (question.type === "guess_partner") {
    return (
      <div className="flex flex-col gap-1">
        <Slider
          label={question.text}
          value={typeof value === "number" ? value : 5}
          gradient={{ from: "#ffffff", to: "#FFB300" }}
          onChange={(v) => onChange(v)}
        />
        <p className="text-xs text-zinc-400">猜對方 — 之後可以看你猜得多準</p>
      </div>
    );
  }
  if (question.type === "multi_choice") {
    const options = question.options ?? [];
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{question.text}</span>
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
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  active
                    ? "bg-[var(--color-rose)] border-[var(--color-rose)] text-white"
                    : "border-zinc-200 text-zinc-700"
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
  if (question.type === "mood_tags") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{question.text}</span>
        <MoodTags
          values={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }
  if (question.type === "letter") {
    const text = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">✍️ {question.text}</label>
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"親愛的...\n\n想到什麼寫什麼,沒字數限制,我們幫你存下來。"}
          className="text-base leading-relaxed"
          style={{ fontFamily: "var(--font-handwritten)" }}
        />
        <p className="text-xs text-zinc-400 text-right">{text.length} 字</p>
      </div>
    );
  }
  // short_text
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{question.text}</label>
      <Textarea
        rows={2}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="簡短寫一下..."
      />
    </div>
  );
}
