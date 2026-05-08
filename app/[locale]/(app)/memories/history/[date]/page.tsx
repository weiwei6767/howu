import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TodayCompleted } from "@/components/today/TodayCompleted";
import type { DailyResponse } from "@/lib/supabase/queries";

interface ResponseRow {
  id: string;
  couple_id: string;
  responder_id: string;
  date: string;
  template_id: string | null;
  happiness: number | null;
  energy: number | null;
  stress: number | null;
  us_overall: number | null;
  rotating_answers: unknown;
  mood_tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function HistoryDatePage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);
  if (!isValidDate(date)) notFound();

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select(
      "id, couple_id, responder_id, date, template_id, happiness, energy, stress, us_overall, rotating_answers, mood_tags, created_at, updated_at",
    )
    .eq("couple_id", couple.id)
    .eq("date", date);

  const responses = (respRaw as ResponseRow[] | null) ?? [];
  const my = responses.find((r) => r.responder_id === user.id) ?? null;
  const partnerResp = responses.find((r) => r.responder_id !== user.id) ?? null;

  const [me, partnerProfile] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
  ]);

  if (!my && !partnerResp) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/memories/history"
          className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← 過去的問卷
        </Link>
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">
          這天沒有問卷紀錄。
        </p>
      </div>
    );
  }

  // 拿模板名稱
  const tplId = my?.template_id ?? partnerResp?.template_id ?? null;
  let templateName = "—";
  let templateEmoji = "";
  if (tplId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tpl } = await (supabase as any)
      .from("templates")
      .select("name, emoji")
      .eq("id", tplId)
      .maybeSingle();
    if (tpl) {
      templateName = (tpl as { name: string }).name;
      templateEmoji = (tpl as { emoji: string | null }).emoji ?? "";
    }
  }

  const d = new Date(`${date}T00:00:00`);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  // 沒寫的那邊用空 stub
  const myFor = (my as unknown as DailyResponse) ?? null;
  const partnerFor = (partnerResp as unknown as DailyResponse | null) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/memories/history"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← {ym}
      </Link>
      {myFor ? (
        <TodayCompleted
          templateName={templateName}
          templateEmoji={templateEmoji}
          my={myFor}
          partner={partnerFor}
          partnerName={partnerProfile?.display_name ?? null}
          myName={me?.display_name ?? null}
          streak={{ current_streak: 0, longest_streak: 0 }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            {date}
          </p>
          <h1 className="font-serif text-2xl">
            {d.getMonth() + 1} 月 {d.getDate()} 日 · 星期{WEEK[d.getDay()]}
          </h1>
          <p className="text-sm text-[var(--color-ink-mid)]">
            這天你沒寫,只有 {partnerProfile?.display_name ?? "對方"} 寫了。
          </p>
          <div className="border-l-2 border-[var(--color-accent)] pl-4 py-1 mt-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {templateEmoji} {templateName}
            </p>
            <ul className="flex flex-col gap-3 mt-2">
              {Array.isArray(partnerResp?.rotating_answers) &&
                (partnerResp!.rotating_answers as Array<{ text?: string; value: unknown }>).map(
                  (a, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-[var(--color-ink-mid)]">
                        {a.text ?? "(無題目)"}
                      </p>
                      <p className="mt-0.5 text-[var(--color-ink)]">
                        {Array.isArray(a.value)
                          ? a.value.join("、")
                          : String(a.value ?? "—")}
                      </p>
                    </li>
                  ),
                )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
