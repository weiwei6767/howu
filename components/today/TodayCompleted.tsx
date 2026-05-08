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
  const partnerAnswers = ((partner?.rotating_answers as unknown as AnswerEntry[] | null) ?? null);

  const partnerById = new Map<string, AnswerEntry>();
  for (const a of partnerAnswers ?? []) partnerById.set(a.question_id, a);

  const partnerLabel = partnerName ?? t("today_completed.partner_label");
  const myLabel = myName ?? t("today_completed.partner_label");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 pt-4">
        <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-[0.18em]">
          {t("today_screen.completed_title")}
        </p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          {templateEmoji && <span>{templateEmoji}</span>}
          <span>{templateName}</span>
        </h1>
        <div className="flex items-center gap-3 text-xs text-[var(--color-ink-mid)] mt-1">
          {streak.current_streak > 0 && (
            <span>{t("today_screen.streak_short", { n: streak.current_streak })}</span>
          )}
          {streak.current_streak > 0 && <span>·</span>}
          <span>
            {partner
              ? t("today_screen.both_done")
              : t("today_screen.wait_partner_named", { name: partnerLabel })}
          </span>
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
    <section className="flex flex-col gap-3 pb-5 border-b border-[var(--color-paper-line)] last:border-b-0">
      <header className="flex items-baseline gap-3">
        <span className="font-serif text-sm text-[var(--color-ink-soft)] tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-[15px] leading-snug flex-1 text-[var(--color-ink)]">
          {question || (
            <span className="text-[var(--color-ink-soft)]">
              {t("today_screen.no_question")}
            </span>
          )}
        </h3>
      </header>

      {type === "slider" || type === "guess_partner" ? (
        <SliderCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
          t={t}
        />
      ) : type === "multi_choice" || type === "mood_tags" ? (
        <ChoiceCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
          t={t}
        />
      ) : type === "letter" ? (
        <LetterCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
          t={t}
        />
      ) : (
        <TextCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
          t={t}
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
  t,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof mine === "number" ? mine : null;
  const tt = typeof theirs === "number" ? theirs : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      <SideValue label={myName} value={m} t={t} />
      {partnerWritten ? <SideValue label={partnerName} value={tt} t={t} /> : <PartnerWaiting t={t} />}
    </div>
  );
}

function SideValue({ label, value, t }: { label: string; value: number | null; t: T }) {
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
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t("today_completed.out_of_ten")}
        </span>
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
  t,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = Array.isArray(mine) ? (mine as string[]) : [];
  const tt = Array.isArray(theirs) ? (theirs as string[]) : [];
  const setM = new Set(m);
  const setT = new Set(tt);

  return (
    <div className="grid grid-cols-2 gap-6">
      <SidePills label={myName} items={m} highlight={(x) => setT.has(x)} t={t} />
      {partnerWritten ? (
        <SidePills label={partnerName} items={tt} highlight={(x) => setM.has(x)} t={t} />
      ) : (
        <PartnerWaiting t={t} />
      )}
    </div>
  );
}

function SidePills({
  label,
  items,
  highlight,
  t,
}: {
  label: string;
  items: string[];
  highlight: (s: string) => boolean;
  t: T;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      {items.length === 0 ? (
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t("today_completed.no_pick")}
        </span>
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
  t,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof mine === "string" ? mine : "";
  const tt = typeof theirs === "string" ? theirs : "";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <SideQuote label={myName} text={m} t={t} />
      {partnerWritten ? <SideQuote label={partnerName} text={tt} t={t} /> : <PartnerWaiting t={t} />}
    </div>
  );
}

function SideQuote({ label, text, t }: { label: string; text: string; t: T }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      <p className="font-serif text-[15px] leading-relaxed text-[var(--color-ink)]">
        {text.trim() ? (
          text
        ) : (
          <span className="text-[var(--color-ink-soft)] not-italic font-sans text-sm">
            {t("today_completed.no_text")}
          </span>
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
  t,
}: {
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
  t: T;
}) {
  const m = typeof mine === "string" ? mine : "";
  const tt = typeof theirs === "string" ? theirs : "";
  return (
    <div className="flex flex-col gap-4">
      <LetterCard label={t("today_completed.letter_by", { name: myName })} text={m} t={t} />
      {partnerWritten ? (
        <LetterCard label={t("today_completed.letter_by", { name: partnerName })} text={tt} t={t} />
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

function PartnerWaiting({ t }: { t: T }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {t("today_completed.partner_label")}
      </span>
      <span className="text-sm text-[var(--color-ink-soft)]">
        — {t("today_completed.wait_partner")}
      </span>
    </div>
  );
}
