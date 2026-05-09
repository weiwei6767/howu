"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const myAnswers = (my.rotating_answers as unknown as AnswerEntry[]) ?? [];
  const partnerAnswers =
    (partner?.rotating_answers as unknown as AnswerEntry[] | null) ?? null;

  const partnerById = new Map<string, AnswerEntry>();
  for (const a of partnerAnswers ?? []) partnerById.set(a.question_id, a);

  const partnerLabel = partnerName ?? t("today_completed.partner_label");
  const myLabel = myName ?? t("today_completed.partner_label");
  const bothDone = !!partner;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── 頂部狀態卡 ─── */}
      <header className="rounded-[var(--radius-card)] border border-[var(--color-accent)]/20 bg-gradient-to-b from-[var(--color-accent-soft)]/50 to-white px-6 py-7 flex flex-col items-center text-center gap-2">
        <div className="relative">
          <span className="absolute -top-1 -left-3 text-[var(--color-accent)]/60 text-xs">✦</span>
          <span className="absolute -top-1 -right-3 text-[var(--color-accent)]/60 text-xs">✦</span>
          <div
            aria-hidden
            className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg shadow-[0_4px_16px_-4px_rgba(184,50,77,0.4)]"
          >
            ✓
          </div>
        </div>
        <h1 className="font-serif text-2xl leading-tight mt-2">
          {t("today_screen.completed_title")}
        </h1>
        <p className="text-sm text-[var(--color-ink-mid)] flex items-center gap-1.5">
          {templateEmoji && <span>{templateEmoji}</span>}
          <span>{templateName}</span>
        </p>

        <div className="flex items-center gap-2 mt-2">
          {streak.current_streak > 0 && (
            <span className="inline-flex items-baseline gap-1 text-[11px] px-3 py-1 rounded-full bg-white border border-[var(--color-accent)]/25 tabular-nums">
              <span className="text-[var(--color-accent)]">✦</span>
              <span className="text-[var(--color-ink)]">
                {t("today_screen.streak_short", { n: streak.current_streak })}
              </span>
            </span>
          )}
          <span
            className={`text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border ${
              bothDone
                ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)] text-white"
                : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
            }`}
          >
            {bothDone
              ? t("today_screen.both_done")
              : t("today_screen.wait_partner_named", { name: partnerLabel })}
          </span>
        </div>
      </header>

      {/* ─── 題目對照 ─── */}
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
              partnerWritten={bothDone}
              myName={myLabel}
              partnerName={partnerLabel}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

function AnswerRow({
  index,
  question,
  type,
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
  t,
}: {
  index: number;
  question: string;
  type: string;
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] px-4 py-4 flex flex-col gap-3">
      <header className="flex items-baseline gap-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-[var(--color-paper-line)] font-serif text-xs text-[var(--color-ink)] tabular-nums shrink-0">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-[15px] leading-snug flex-1 text-[var(--color-ink)] font-medium">
          {question || (
            <span className="text-[var(--color-ink-soft)] font-normal">
              {t("today_screen.no_question")}
            </span>
          )}
        </h3>
      </header>

      <div>
        {type === "slider" || type === "guess_partner" ? (
          <SliderRow
            myValue={myValue}
            partnerValue={partnerValue}
            partnerWritten={partnerWritten}
            myName={myName}
            partnerName={partnerName}
            t={t}
          />
        ) : type === "multi_choice" || type === "mood_tags" ? (
          <ChoiceRow
            myValue={myValue}
            partnerValue={partnerValue}
            partnerWritten={partnerWritten}
            myName={myName}
            partnerName={partnerName}
            t={t}
          />
        ) : type === "letter" ? (
          <LetterRow
            myValue={myValue}
            partnerValue={partnerValue}
            partnerWritten={partnerWritten}
            myName={myName}
            partnerName={partnerName}
            t={t}
          />
        ) : (
          <TextRow
            myValue={myValue}
            partnerValue={partnerValue}
            partnerWritten={partnerWritten}
            myName={myName}
            partnerName={partnerName}
            t={t}
          />
        )}
      </div>
    </section>
  );
}

// ───────── slider:單一條 bar 上有兩個點 ─────────
function SliderRow({
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
  t,
}: {
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof myValue === "number" ? myValue : null;
  const p = typeof partnerValue === "number" ? partnerValue : null;

  function pct(v: number | null) {
    if (v === null) return null;
    return ((v - 1) / 9) * 100;
  }
  const myPct = pct(m);
  const pPct = pct(p);
  const diff = m !== null && p !== null ? Math.abs(m - p) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* 我 */}
      <NumberLine
        label={myName}
        value={m}
        pct={myPct}
        accent="ink"
        t={t}
      />
      {/* 對方 */}
      {partnerWritten ? (
        <NumberLine
          label={partnerName}
          value={p}
          pct={pPct}
          accent="accent"
          t={t}
        />
      ) : (
        <p className="text-xs text-[var(--color-ink-soft)] py-1">
          — {t("today_completed.wait_partner")}
        </p>
      )}
      {/* 差距小提示 */}
      {diff !== null && diff <= 1 && partnerWritten && (
        <p className="text-[11px] text-[var(--color-accent-deep)]">
          ✦ 兩個人答得很接近
        </p>
      )}
    </div>
  );
}

function NumberLine({
  label,
  value,
  pct,
  accent,
  t,
}: {
  label: string;
  value: number | null;
  pct: number | null;
  accent: "ink" | "accent";
  t: T;
}) {
  const dotColor =
    accent === "ink" ? "var(--color-ink)" : "var(--color-accent)";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider w-14 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 relative h-px bg-[var(--color-paper-line)]">
        {pct !== null && (
          <span
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{ left: `${pct}%`, background: dotColor }}
          />
        )}
      </div>
      <span className="font-serif text-lg tabular-nums text-[var(--color-ink)] w-12 text-right shrink-0">
        {value ?? "—"}
        <span className="text-xs text-[var(--color-ink-soft)] ml-0.5">
          {t("today_completed.out_of_ten")}
        </span>
      </span>
    </div>
  );
}

// ───────── multi_choice / mood_tags:重疊集合提示 ─────────
function ChoiceRow({
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
  t,
}: {
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = Array.isArray(myValue) ? (myValue as string[]) : [];
  const p = Array.isArray(partnerValue) ? (partnerValue as string[]) : [];
  const setM = new Set(m);
  const setP = new Set(p);

  return (
    <div className="flex flex-col gap-3">
      <PillsLine label={myName} items={m} mark={(x) => setP.has(x)} t={t} />
      {partnerWritten ? (
        <PillsLine
          label={partnerName}
          items={p}
          mark={(x) => setM.has(x)}
          t={t}
        />
      ) : (
        <p className="text-xs text-[var(--color-ink-soft)] py-1">
          — {t("today_completed.wait_partner")}
        </p>
      )}
    </div>
  );
}

function PillsLine({
  label,
  items,
  mark,
  t,
}: {
  label: string;
  items: string[];
  mark: (s: string) => boolean;
  t: T;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider w-14 shrink-0 truncate">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {items.length === 0 ? (
          <span className="text-xs text-[var(--color-ink-soft)]">
            {t("today_completed.no_pick")}
          </span>
        ) : (
          items.map((x) => (
            <span
              key={x}
              className={`text-xs px-2 py-0.5 rounded-full ${
                mark(x)
                  ? "bg-[var(--color-ink)] text-white"
                  : "border border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
              }`}
              title={mark(x) ? "兩人都選" : ""}
            >
              {x}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ───────── short_text:垂直堆疊雙引文 ─────────
function TextRow({
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
  t,
}: {
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof myValue === "string" ? myValue : "";
  const p = typeof partnerValue === "string" ? partnerValue : "";
  return (
    <div className="flex flex-col gap-3">
      <Quote label={myName} text={m} t={t} />
      {partnerWritten ? (
        <Quote label={partnerName} text={p} t={t} />
      ) : (
        <p className="text-xs text-[var(--color-ink-soft)] py-1">
          — {t("today_completed.wait_partner")}
        </p>
      )}
    </div>
  );
}

function Quote({ label, text, t }: { label: string; text: string; t: T }) {
  const empty = !text.trim();
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      {empty ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          — {t("today_completed.no_text")}
        </p>
      ) : (
        <p className="font-serif text-[15px] leading-relaxed text-[var(--color-ink)] italic">
          “{text}”
        </p>
      )}
    </div>
  );
}

// ───────── letter ─────────
function LetterRow({
  myValue,
  partnerValue,
  partnerWritten,
  myName,
  partnerName,
  t,
}: {
  myValue: unknown;
  partnerValue: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof myValue === "string" ? myValue : "";
  const p = typeof partnerValue === "string" ? partnerValue : "";
  return (
    <div className="flex flex-col gap-4">
      <LetterCard label={t("today_completed.letter_by", { name: myName })} text={m} t={t} />
      {partnerWritten ? (
        <LetterCard
          label={t("today_completed.letter_by", { name: partnerName })}
          text={p}
          t={t}
        />
      ) : (
        <div className="border-l-2 border-[var(--color-paper-line)] pl-4 py-2 text-xs text-[var(--color-ink-soft)]">
          {t("today_completed.letter_wait", { name: partnerName })}
        </div>
      )}
    </div>
  );
}

function LetterCard({ label, text, t }: { label: string; text: string; t: T }) {
  const empty = !text.trim();
  return (
    <div className="border-l-2 border-[var(--color-accent)] pl-4 py-1">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1.5">
        {label}
      </span>
      {empty ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          {t("today_completed.no_text")}
        </p>
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
