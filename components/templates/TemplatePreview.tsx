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
  moodTagOptions: string[];
}

const SLIDER_TYPES = new Set(["slider", "guess_partner"]);

export function TemplatePreview({
  emoji,
  name,
  description,
  questions,
  promises,
  moodTagOptions,
}: Props) {
  const sliderQuestions = questions.filter((q) => SLIDER_TYPES.has(q.type));
  const otherQuestions = questions.filter((q) => !SLIDER_TYPES.has(q.type));
  const isEmpty =
    questions.length === 0 && promises.length === 0 && moodTagOptions.length === 0;

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

        {isEmpty && (
          <div className="surface p-5 text-center text-xs text-[var(--color-ink-soft)]">
            還沒有題目跟小懲罰
            <br />
            從右邊建議挑題開始
          </div>
        )}

        {sliderQuestions.length > 0 && (
          <Section title="今天的指數">
            {sliderQuestions.map((q) => (
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

        {moodTagOptions.length > 0 && (
          <Section title="今天的心情">
            <div className="flex flex-wrap gap-1.5">
              {moodTagOptions.slice(0, 8).map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className={`px-2 py-1 rounded-full text-[10px] border ${
                    i < 2
                      ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                      : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {promises.length > 0 && (
          <div className="rounded-[10px] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-accent-soft)]/40 border border-[var(--color-accent)]/35 px-3 py-2.5 text-[11px] flex flex-col gap-1 shadow-[0_1px_3px_-1px_rgba(184,50,77,0.12)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent-deep)] flex items-center gap-1">
              <span>✦</span>
              如果今天沒寫的小懲罰
            </span>
            {promises.map((p) => (
              <div key={p.id} className="text-[var(--color-ink)] leading-relaxed">
                · {p.text}
              </div>
            ))}
          </div>
        )}

        {(questions.length > 0 || moodTagOptions.length > 0) && (
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
    const customTags = Array.isArray(q.options) ? (q.options as string[]) : null;
    const tags =
      customTags && customTags.length > 0
        ? customTags
        : ["開心", "六六大順", "心煩", "低氣壓", "平常心"];
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[var(--color-ink)]">{q.text}</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className={`px-2 py-1 rounded-full text-[10px] border ${
                i < 2
                  ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                  : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
              }`}
            >
              {tag}
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
