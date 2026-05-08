import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ResponseRow {
  date: string;
  responder_id: string;
  template_id: string | null;
  rotating_answers: unknown;
}

interface TemplateRow {
  id: string;
  name: string;
  emoji: string | null;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id, template_id, rotating_answers")
    .eq("couple_id", couple.id)
    .order("date", { ascending: false })
    .limit(365);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  // 依日期分組
  type DayInfo = {
    date: string;
    responders: Set<string>;
    templateIds: Set<string>;
    answerCount: number;
  };
  const byDate = new Map<string, DayInfo>();
  for (const r of responses) {
    const info = byDate.get(r.date) ?? {
      date: r.date,
      responders: new Set(),
      templateIds: new Set(),
      answerCount: 0,
    };
    info.responders.add(r.responder_id);
    if (r.template_id) info.templateIds.add(r.template_id);
    if (Array.isArray(r.rotating_answers)) info.answerCount += r.rotating_answers.length;
    byDate.set(r.date, info);
  }

  // 拿模板資訊
  const allTplIds = Array.from(new Set(responses.map((r) => r.template_id).filter((x): x is string => !!x)));
  const tplMap = new Map<string, TemplateRow>();
  if (allTplIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tplsRaw } = await (supabase as any)
      .from("templates")
      .select("id, name, emoji")
      .in("id", allTplIds);
    for (const t of (tplsRaw as TemplateRow[] | null) ?? []) tplMap.set(t.id, t);
  }

  // 月份分組
  const days = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  const byMonth = new Map<string, DayInfo[]>();
  for (const d of days) {
    const ym = d.date.slice(0, 7);
    const arr = byMonth.get(ym) ?? [];
    arr.push(d);
    byMonth.set(ym, arr);
  }
  const months = Array.from(byMonth.entries());

  return (
    <div className="flex flex-col gap-7">
      <Link
        href="/memories"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← 回憶
      </Link>
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          History
        </p>
        <h1 className="font-serif text-3xl mt-1">過去的問卷</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2">
          總共 {days.length} 天 · {responses.length} 份
        </p>
      </header>

      {months.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">
          還沒有歷史問卷。寫一陣子之後這裡就會有東西看。
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {months.map(([ym, list]) => {
            const [yy, mm] = ym.split("-");
            return (
              <section key={ym} className="flex flex-col gap-3">
                <header className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-2">
                  <h2 className="font-serif text-xl">
                    {yy} 年 {Number(mm)} 月
                  </h2>
                  <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
                    {list.length} 天
                  </span>
                </header>
                <ul className="flex flex-col">
                  {list.map((d) => {
                    const date = new Date(`${d.date}T00:00:00`);
                    const day = date.getDate();
                    const wd = WEEK[date.getDay()];
                    const tplNames = Array.from(d.templateIds)
                      .map((id) => tplMap.get(id))
                      .filter((x): x is TemplateRow => !!x);
                    const both = d.responders.size === 2;
                    return (
                      <li
                        key={d.date}
                        className="border-b border-[var(--color-paper-line)] last:border-b-0"
                      >
                        <Link
                          href={`/memories/history/${d.date}`}
                          className="flex items-center gap-4 py-3 group"
                        >
                          <div className="font-serif text-2xl tabular-nums w-10 text-[var(--color-ink)]">
                            {day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[var(--color-ink)] truncate">
                              {tplNames.length > 0
                                ? tplNames.map((t) => `${t.emoji ?? ""} ${t.name}`.trim()).join(" · ")
                                : "(無模板紀錄)"}
                            </div>
                            <div className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                              週{wd} · {both ? "兩人都寫" : "只一人寫"}
                            </div>
                          </div>
                          <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
