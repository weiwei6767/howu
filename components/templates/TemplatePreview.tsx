"use client";

import { IPhoneFrame } from "./IPhoneFrame";

interface Question {
  id: string;
  type: string;
  text: string;
  options: unknown;
}

interface PromiseRow {
  id: string;
  text: string;
}

interface Props {
  emoji: string;
  name: string;
  description: string;
  questions: Question[];
  promises: PromiseRow[];
}

const MOOD_TYPES = new Set(["slider", "mood_tags"]);

export function TemplatePreview({ emoji, name, description, questions, promises }: Props) {
  const moodQuestions = questions.filter((q) => MOOD_TYPES.has(q.type));
  const otherQuestions = questions.filter((q) => !MOOD_TYPES.has(q.type));

  return (
    <IPhoneFrame>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {emoji && <span className="text-xl">{emoji}</span>}
            <h2 className="font-serif text-lg truncate">
              {name || "模板名稱"}
            </h2>
          </div>
          {description && (
            <p className="text-[11px] text-[var(--color-ink-soft)] leading-snug">
              {description}
            </p>
          )}
        </header>

        {questions.length === 0 && promises.length === 0 && (
          <div className="surface p-5 text-center text-xs text-[var(--color-ink-soft)]">
            還沒有題目跟承諾
            <br />
            從右邊建議挑題開始
          </div>
        )}

        {moodQuestions.length > 0 && (
          <Section title="今天的心情">
            {moodQuestions.map((q) => (
              <PreviewQuestion key={q.id} q={q} />
            ))}
          </Section>
        )}

        {otherQuestions.length > 0 && (
          <Section title="問題">
            {otherQuestions.map((q) => (
              <PreviewQuestion key={q.id} q={q} />
            ))}
          </Section>
        )}

        {promises.length > 0 && (
          <div className="border-l-2 border-[var(--color-accent)] pl-3 py-1 text-[11px] flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              這份問卷的承諾
            </span>
            {promises.map((p) => (
              <div key={p.id} className="text-[var(--color-ink)]">{p.text}</div>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <button
            type="button"
            disabled
            className="w-full h-9 rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white text-xs"
          >
            完成今日問卷
          </button>
        )}
      </div>
    </IPhoneFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
        {title}
      </span>
      {children}
    </div>
  );
}

function PreviewQuestion({ q }: { q: Question }) {
  if (q.type === "slider" || q.type === "guess_partner") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
          <span className="font-serif text-base tabular-nums text-[var(--color-ink)]">
            5
          </span>
        </div>
        <div className="relative h-px bg-[var(--color-paper-line)]">
          <div className="absolute top-0 left-0 h-px bg-[var(--color-ink)] w-[44%]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[44%] -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-ink)]" />
        </div>
        {q.type === "guess_partner" && (
          <span className="text-[10px] text-[var(--color-ink-soft)]">
            猜對方
          </span>
        )}
      </div>
    );
  }

  if (q.type === "multi_choice") {
    const options = (Array.isArray(q.options) ? (q.options as string[]) : []).slice(0, 5);
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.length === 0 ? (
            <span className="text-[10px] text-[var(--color-ink-soft)]">(沒選項)</span>
          ) : (
            options.map((opt, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded-full text-[10px] border ${
                  i === 0
                    ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                    : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
                }`}
              >
                {opt}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  if (q.type === "mood_tags") {
    const tags = ["平靜", "開心", "感謝", "踏實"];
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={t}
              className={`px-2 py-1 rounded-full text-[10px] border ${
                i < 2
                  ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                  : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === "letter") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
        <div
          className="rounded-md border border-[var(--color-paper-line)] bg-white px-3 py-2 min-h-20 text-[12px] text-[var(--color-ink-soft)] leading-relaxed"
          style={{ fontFamily: "var(--font-handwritten)" }}
        >
          親愛的⋯⋯
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
      <div className="rounded-md border border-[var(--color-paper-line)] bg-white px-3 py-2 text-[11px] text-[var(--color-ink-soft)]">
        簡短寫一下
      </div>
    </div>
  );
}
