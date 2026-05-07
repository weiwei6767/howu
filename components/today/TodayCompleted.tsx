"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DailyResponse } from "@/lib/supabase/queries";

interface Props {
  templateName: string;
  templateEmoji: string;
  my: DailyResponse;
  partner: DailyResponse | null;
  partnerName: string | null;
  streak: { current_streak: number; longest_streak: number };
}

export function TodayCompleted({
  templateName,
  templateEmoji,
  my,
  partner,
  partnerName,
  streak,
}: Props) {
  const myAnswers = (my.rotating_answers as Array<{
    question_id: string;
    type: string;
    text: string;
    value: unknown;
  }>) ?? [];
  const partnerAnswers = ((partner?.rotating_answers as Array<{
    question_id: string;
    type: string;
    text: string;
    value: unknown;
  }> | null) ?? null);

  return (
    <div className="flex flex-col gap-5">
      <motion.header
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-3 pt-6"
      >
        <div className="text-5xl" aria-hidden>✨</div>
        <h1 className="text-2xl font-semibold">今天寫完了</h1>
        <p className="text-sm text-zinc-500 text-center max-w-xs">
          {templateEmoji} {templateName}
        </p>
        {streak.current_streak > 0 && (
          <Badge tone="rose">🔥 連續 {streak.current_streak} 天</Badge>
        )}
      </motion.header>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {partnerName ?? "對方"} 今天
          </span>
          {partner ? (
            <Badge tone="rose">已寫完</Badge>
          ) : (
            <Badge tone="neutral">還沒寫</Badge>
          )}
        </div>
        {partner ? (
          <ul className="flex flex-col gap-2.5 divide-y divide-zinc-100">
            {(partnerAnswers ?? []).map((a) => (
              <li key={a.question_id} className="pt-2.5 first:pt-0 flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{a.text}</span>
                <span className="text-sm">
                  <AnswerView value={a.value} type={a.type} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">等對方寫完才會顯示</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="text-xs text-zinc-400">我寫的</span>
        <ul className="flex flex-col gap-2.5 divide-y divide-zinc-100">
          {myAnswers.map((a) => (
            <li key={a.question_id} className="pt-2.5 first:pt-0 flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{a.text}</span>
              <span className="text-sm">
                <AnswerView value={a.value} type={a.type} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function AnswerView({ value, type }: { value: unknown; type: string }) {
  if (value === null || value === undefined) return <span className="text-zinc-400">—</span>;
  if (type === "slider" || type === "guess_partner") {
    return <span className="font-semibold tabular-nums text-[var(--color-rose)]">{value as number}</span>;
  }
  if (type === "multi_choice" || type === "mood_tags") {
    if (Array.isArray(value) && value.length === 0) return <span className="text-zinc-400">沒選</span>;
    return (
      <span className="flex flex-wrap gap-1">
        {(value as string[]).map((v) => (
          <Badge key={v} tone="rose">{v}</Badge>
        ))}
      </span>
    );
  }
  if (type === "letter") {
    const text = String(value).trim();
    if (!text) return <span className="text-zinc-400">沒寫</span>;
    return (
      <div
        className="rounded-[var(--radius-card)] bg-[var(--color-rose-soft)]/20 border-l-4 border-[var(--color-rose)] px-4 py-3 leading-relaxed text-base whitespace-pre-wrap"
        style={{ fontFamily: "var(--font-handwritten)" }}
      >
        {text}
      </div>
    );
  }
  return <span>{String(value).trim() || <span className="text-zinc-400">空白</span>}</span>;
}
