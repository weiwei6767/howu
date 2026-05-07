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

export function TemplatePreview({ emoji, name, description, questions, promises }: Props) {
  return (
    <IPhoneFrame>
      <div className="flex flex-col gap-4">
        {/* 標題 */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h2 className="text-lg font-semibold tracking-tight truncate">
              {name || "模板名稱"}
            </h2>
          </div>
          {description && (
            <p className="text-[11px] text-zinc-500 leading-snug">{description}</p>
          )}
        </header>

        {promises.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">
              這份問卷的承諾
            </span>
            {promises.map((p) => (
              <div key={p.id} className="text-zinc-700">🤝 {p.text}</div>
            ))}
          </div>
        )}

        {/* 題目們 */}
        <div className="flex flex-col gap-4">
          {questions.length === 0 ? (
            <div className="rounded-xl bg-white shadow-sm p-4 text-center text-xs text-zinc-400">
              還沒有題目
              <br />
              從右邊建議挑一題開始
            </div>
          ) : (
            questions.map((q) => <PreviewQuestion key={q.id} q={q} />)
          )}
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            disabled
            className="w-full h-10 rounded-full bg-[var(--color-rose)] text-white text-sm font-medium opacity-90 mt-2"
          >
            完成今日問卷
          </button>
        )}
      </div>
    </IPhoneFrame>
  );
}

function PreviewQuestion({ q }: { q: Question }) {
  if (q.type === "slider" || q.type === "guess_partner") {
    const isGuess = q.type === "guess_partner";
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-zinc-700">{q.text}</span>
          <span
            className="text-lg font-semibold tabular-nums"
            style={{ color: isGuess ? "#FFB300" : "#C2185B" }}
          >
            5
          </span>
        </div>
        <div
          className="relative h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, #ffffff 0%, ${isGuess ? "#FFB300" : "#C2185B"} 100%)`,
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-[44%] w-3.5 h-3.5 rounded-full bg-white border border-zinc-200 shadow" />
        </div>
        {isGuess && (
          <span className="text-[10px] text-zinc-400">猜對方 — 看你猜得多準</span>
        )}
      </div>
    );
  }

  if (q.type === "multi_choice") {
    const options = (Array.isArray(q.options) ? (q.options as string[]) : []).slice(0, 5);
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-700">{q.text}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.length === 0 ? (
            <span className="text-[10px] text-zinc-400">(沒選項)</span>
          ) : (
            options.map((opt, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded-full text-[10px] border ${
                  i === 0
                    ? "bg-[var(--color-rose)] border-[var(--color-rose)] text-white"
                    : "border-zinc-200 text-zinc-700"
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
        <span className="text-xs font-medium text-zinc-700">{q.text}</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={t}
              className={`px-2 py-1 rounded-full text-[10px] border ${
                i < 2
                  ? "bg-[var(--color-rose-soft)] border-[var(--color-rose)] text-[var(--color-rose)]"
                  : "border-zinc-200 text-zinc-600"
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
        <span className="text-xs font-medium text-zinc-700">{q.text}</span>
        <div
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 min-h-24 text-[11px] text-zinc-400 leading-relaxed"
          style={{ fontFamily: "var(--font-handwritten)" }}
        >
          親愛的...
          <br />
          <span className="opacity-50">想到什麼寫什麼,沒字數限制</span>
        </div>
      </div>
    );
  }

  // short_text
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-700">{q.text}</span>
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-400">
        簡短寫一下...
      </div>
    </div>
  );
}
