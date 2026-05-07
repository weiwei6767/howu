import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { getJournalMonthSummary, getJournalEntriesOfDate } from "@/lib/journal/queries";
import { JournalCalendar } from "@/components/journal/JournalCalendar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const today = now.toISOString().slice(0, 10);

  const [stats, todayEntries] = await Promise.all([
    getJournalMonthSummary(user.id, yyyy, mm),
    getJournalEntriesOfDate(user.id, today),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("journal.title")}</h1>

      {/* 今天的入口 */}
      <Card className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">今天</span>
          <span className="text-xs text-zinc-500">
            {todayEntries.length === 0 ? "還沒寫" : `寫了 ${todayEntries.length} 篇`}
          </span>
        </div>
        <Link
          href={`/journal/${today}`}
          className="text-sm bg-[var(--color-rose)] text-white px-4 py-2 rounded-full font-medium"
        >
          {todayEntries.length === 0 ? "+ 寫今天" : "看今天 →"}
        </Link>
      </Card>

      {/* 月曆 */}
      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {yyyy} 年 {mm} 月
          </h2>
          <span className="text-xs text-zinc-400">點任一天打開</span>
        </header>
        <JournalCalendar year={yyyy} month={mm} stats={stats} />
      </section>
    </div>
  );
}
