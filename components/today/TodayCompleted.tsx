"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

  // 配對:同一個 question_id 我跟對方放一起
  const partnerById = new Map<string, AnswerEntry>();
  for (const a of partnerAnswers ?? []) partnerById.set(a.question_id, a);

  return (
    <div className="flex flex-col gap-5">
      <motion.header
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-2 pt-6"
      >
        <div className="text-5xl" aria-hidden>✨</div>
        <h1 className="text-2xl font-semibold">今天寫完了</h1>
        <p className="text-sm text-zinc-500 text-center">
          {templateEmoji} {templateName}
        </p>
        <div className="flex items-center gap-2">
          {streak.current_streak > 0 && (
            <Badge tone="rose">🔥 連續 {streak.current_streak} 天</Badge>
          )}
          {partner ? (
            <Badge tone="green">對方也寫完了</Badge>
          ) : (
            <Badge tone="neutral">等對方寫</Badge>
          )}
        </div>
      </motion.header>

      {/* 題目對照 */}
      <div className="flex flex-col gap-4">
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
    <Card className="flex flex-col gap-3">
      <header className="flex items-baseline gap-2">
        <span className="text-xs text-zinc-400 font-mono tabular-nums">{String(index).padStart(2, "0")}</span>
        <h3 className="text-sm font-semibold leading-snug flex-1">
          {question || <span className="text-zinc-400">(無題目)</span>}
        </h3>
      </header>

      {/* 不同 type 不同 layout */}
      {type === "slider" || type === "guess_partner" ? (
        <SliderCompare
          type={type}
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
        // short_text
        <TextCompare
          mine={myValue}
          theirs={partnerValue}
          partnerWritten={partnerWritten}
          myName={myName}
          partnerName={partnerName}
        />
      )}
    </Card>
  );
}

// ──────────────── slider / guess_partner: 大字 + bar
function SliderCompare({
  type,
  mine,
  theirs,
  partnerWritten,
  myName,
  partnerName,
}: {
  type: string;
  mine: unknown;
  theirs: unknown;
  partnerWritten: boolean;
  myName: string;
  partnerName: string;
}) {
  const m = typeof mine === "number" ? mine : null;
  const t = typeof theirs === "number" ? theirs : null;
  const isGuess = type === "guess_partner";
  const accent = isGuess ? "#FFB300" : "#C2185B";
  const matched = m !== null && t !== null && Math.abs(m - t) <= 1;

  return (
    <div className="grid grid-cols-2 gap-3 items-stretch">
      <SideBar label={myName} value={m} accent={accent} />
      {partnerWritten ? (
        <SideBar
          label={partnerName}
          value={t}
          accent={accent}
          rightAlign
          tag={matched && m !== null && t !== null ? "差距 ≤ 1" : undefined}
        />
      ) : (
        <PartnerWaiting />
      )}
    </div>
  );
}

function SideBar({
  label,
  value,
  accent,
  rightAlign,
  tag,
}: {
  label: string;
  value: number | null;
  accent: string;
  rightAlign?: boolean;
  tag?: string;
}) {
  const pct = value !== null ? ((value - 1) / 9) * 100 : 0;
  return (
    <div
      className={`rounded-md bg-zinc-50 px-3 py-2.5 flex flex-col gap-1 ${rightAlign ? "items-end" : ""}`}
    >
      <span className="text-[11px] text-zinc-500">{label}</span>
      <div className={`flex items-baseline gap-1 ${rightAlign ? "flex-row-reverse" : ""}`}>
        <span className="text-3xl font-semibold tabular-nums" style={{ color: accent }}>
          {value ?? "—"}
        </span>
        <span className="text-xs text-zinc-400">/ 10</span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "#f4f4f5" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: accent,
            marginLeft: rightAlign ? "auto" : 0,
          }}
        />
      </div>
      {tag && <span className="text-[10px] text-amber-700">✨ {tag}</span>}
    </div>
  );
}

// ──────────────── multi_choice / mood_tags: pills 對照
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
    <div className="grid grid-cols-2 gap-3">
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
    <div className="rounded-md bg-zinc-50 px-3 py-2.5 flex flex-col gap-1.5">
      <span className="text-[11px] text-zinc-500">{label}</span>
      {items.length === 0 ? (
        <span className="text-xs text-zinc-400">沒選</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((x) => (
            <span
              key={x}
              className={`px-2 py-0.5 rounded-full text-xs border ${
                highlight(x)
                  ? "bg-[var(--color-rose)] border-[var(--color-rose)] text-white"
                  : "bg-white border-zinc-200 text-zinc-700"
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

// ──────────────── short_text: quote
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SideQuote label={myName} text={m} />
      {partnerWritten ? <SideQuote label={partnerName} text={t} /> : <PartnerWaiting />}
    </div>
  );
}

function SideQuote({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2.5 flex flex-col gap-1">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <p className="text-sm leading-relaxed">
        {text.trim() ? (
          <>「{text}」</>
        ) : (
          <span className="text-zinc-400">沒寫</span>
        )}
      </p>
    </div>
  );
}

// ──────────────── letter: 大手寫卡 上下排
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
    <div className="flex flex-col gap-3">
      <LetterCard label={`${myName} 寫的`} text={m} owner="me" />
      {partnerWritten ? (
        <LetterCard label={`${partnerName} 寫的`} text={t} owner="partner" />
      ) : (
        <div className="rounded-md bg-zinc-50 border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
          等 {partnerName} 寫完才看得到
        </div>
      )}
    </div>
  );
}

function LetterCard({ label, text, owner }: { label: string; text: string; owner: "me" | "partner" }) {
  const empty = !text.trim();
  return (
    <div
      className={`rounded-[var(--radius-card)] border-l-4 px-4 py-3 ${
        owner === "me"
          ? "bg-rose-50 border-[var(--color-rose)]"
          : "bg-amber-50 border-amber-300"
      }`}
    >
      <span className="text-[11px] text-zinc-500 block mb-1">{label}</span>
      {empty ? (
        <p className="text-sm text-zinc-400">沒寫</p>
      ) : (
        <p
          className="text-base leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "var(--font-handwritten)" }}
        >
          {text}
        </p>
      )}
    </div>
  );
}

function PartnerWaiting() {
  return (
    <div className="rounded-md bg-zinc-50 border border-dashed border-zinc-200 px-3 py-2.5 flex items-center justify-center text-xs text-zinc-400">
      ⏳ 等對方寫完
    </div>
  );
}
