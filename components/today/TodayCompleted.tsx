"use client";

import type { DailyResponse } from "@/lib/supabase/queries";

interface AnswerEntry {
  question_id: string;
  type: string;
  text?: string;
  value: unknown;
}

interface Props {
  templateName: string;
  templateEmoji: string;
  my: DailyResponse;
  partner: DailyResponse | null;
  partnerName: string | null;
  myName?: string | null;
  streak: { current_streak: number; longest_streak: number };
}

export function TodayCompleted({
  templateName,
  templateEmoji,
  my,
  partner,
  partnerName,
  myName,
  streak,
}: Props) {
  const myAnswers = (my.rotating_answers as unknown as AnswerEntry[]) ?? [];
  const partnerAnswers = ((partner?.rotating_answers as unknown as AnswerEntry[] | null) ?? null);

  const partnerById = new Map<string, AnswerEntry>();
  for (const a of partnerAnswers ?? []) partnerById.set(a.question_id, a);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 pt-4">
        <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-[0.18em]">
          今天寫完了
        </p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          {templateEmoji && <span>{templateEmoji}</span>}
          <span>{templateName}</span>
        </h1>
        <div className="flex items-center gap-3 text-xs text-[var(--color-ink-mid)] mt-1">
          {streak.current_streak > 0 && <span>連續 {streak.current_streak} 天</span>}
          <span>·</span>
          <span>{partner ? "兩人都寫完了" : `等 ${partnerName ?? "對方"} 寫`}</span>
        </div>
      </header>

      <div className="flex flex-col gap-5">
        {myAnswers.map((mine, i) => {
          const theirs = partnerById.get(mine.question_id) ?? null;
          return (
            <AnswerRow
              key={mine.question_id}
              index={i + 1}
              question={mine.text ?? ""}
              type={mine.type}
              myValue={mine.value}
              partnerValue={theirs?.value}
              partnerWritten={!!partner}
              myName={myName ?? "我"}
              partnerName={partnerName ?? "對方"}
            />
          );
        })}
      </div>
    </div>
  );
}

function AnswerRow({
  index,
  question,
  type,
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
}: {
  index: number;
  question: string;
  type: string;
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  return (
    <section className="flex flex-col gap-3 pb-5 border-b border-[var(--color-paper-line)] last:border-b-0">
      <header className="flex items-baseline gap-3">
        <span className="font-serif text-sm text-[var(--color-ink-soft)] tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-[15px] leading-snug flex-1 text-[var(--color-ink)]">
          {question || <span className="text-[var(--color-ink-soft)]">(無題目)</span>}
        </h3>
      </header>

      {type === "slider" || type === "guess_partner" ? (
        <SliderCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
        />
      ) : type === "multi_choice" || type === "mood_tags" ? (
        <ChoiceCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
        />
      ) : type === "letter" ? (
        <LetterCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
        />
      ) : (
        <TextCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
        />
      )}
    </section>
  );
}

function SliderCompare({
  mine,
  theirs,
  partnerWritten,
  myName,
  partnerName,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  const m = typeof mine === "number" ? mine : null;
  const t = typeof theirs === "number" ? theirs : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      <SideValue label={myName} value={m} />
      {partnerWritten ? <SideValue label={partnerName} value={t} /> : <PartnerWaiting />}
    </div>
  );
}

function SideValue({ label, value }: { label: string; value: number | null }) {
  const pct = value !== null ? ((value - 1) / 9) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-3xl tabular-nums text-[var(--color-ink)]">
          {value ?? "—"}
        </span>
        <span className="text-xs text-[var(--color-ink-soft)]">/ 10</span>
      </div>
      <div className="w-full h-px bg-[var(--color-paper-line)]">
        <div
          className="h-px bg-[var(--color-ink)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChoiceCompare({
  mine,
  theirs,
  partnerWritten,
  myName,
  partnerName,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  const m = Array.isArray(mine) ? (mine as string[]) : [];
  const t = Array.isArray(theirs) ? (theirs as string[]) : [];
  const setM = new Set(m);
  const setT = new Set(t);

  return (
    <div className="grid grid-cols-2 gap-6">
      <SidePills label={myName} items={m} highlight={(x) => setT.has(x)} />
      {partnerWritten ? (
        <SidePills label={partnerName} items={t} highlight={(x) => setM.has(x)} />
      ) : (
        <PartnerWaiting />
      )}
    </div>
  );
}

function SidePills({
  label,
  items,
  highlight,
}: {
  label: string;
  items: string[];
  highlight: (s: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      {items.length === 0 ? (
        <span className="text-xs text-[var(--color-ink-soft)]">沒選</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((x) => (
            <span
              key={x}
              className={`px-2 py-0.5 rounded-full text-xs ${
                highlight(x)
                  ? "bg-[var(--color-ink)] text-white"
                  : "border border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
              }`}
              title={highlight(x) ? "兩個都選了這個" : ""}
            >
              {x}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TextCompare({
  mine,
  theirs,
  partnerWritten,
  myName,
  partnerName,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  const m = typeof mine === "string" ? mine : "";
  const t = typeof theirs === "string" ? theirs : "";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <SideQuote label={myName} text={m} />
      {partnerWritten ? <SideQuote label={partnerName} text={t} /> : <PartnerWaiting />}
    </div>
  );
}

function SideQuote({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      <p className="font-serif text-[15px] leading-relaxed text-[var(--color-ink)]">
        {text.trim() ? (
          text
        ) : (
          <span className="text-[var(--color-ink-soft)] not-italic font-sans text-sm">沒寫</span>
        )}
      </p>
    </div>
  );
}

function LetterCompare({
  mine,
  theirs,
  partnerWritten,
  myName,
  partnerName,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  const m = typeof mine === "string" ? mine : "";
  const t = typeof theirs === "string" ? theirs : "";
  return (
    <div className="flex flex-col gap-4">
      <LetterCard label={`${myName} 寫的`} text={m} />
      {partnerWritten ? (
        <LetterCard label={`${partnerName} 寫的`} text={t} />
      ) : (
        <div className="border-l-2 border-[var(--color-paper-line)] pl-4 py-2 text-xs text-[var(--color-ink-soft)]">
          等 {partnerName} 寫完才看得到
        </div>
      )}
    </div>
  );
}

function LetterCard({ label, text }: { label: string; text: string }) {
  const empty = !text.trim();
  return (
    <div className="border-l-2 border-[var(--color-accent)] pl-4 py-1">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1.5">
        {label}
      </span>
      {empty ? (
        <p className="text-sm text-[var(--color-ink-soft)]">沒寫</p>
      ) : (
        <p
          className="text-base leading-relaxed whitespace-pre-wrap text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-handwritten)", fontSize: "1.1rem" }}
        >
          {text}
        </p>
      )}
    </div>
  );
}

function PartnerWaiting() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        對方
      </span>
      <span className="text-sm text-[var(--color-ink-soft)]">— 等對方寫完</span>
    </div>
  );
}
