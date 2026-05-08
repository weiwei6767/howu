import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { getJournalMonthSummary, getJournalEntriesOfDate } from "@/lib/journal/queries";
import { JournalCalendar } from "@/components/journal/JournalCalendar";

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
    <div className="flex flex-col gap-7">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Journal
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("journal.title")}</h1>
      </header>

      <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">今天</span>
          <span className="text-xs text-[var(--color-ink-soft)]">
            {todayEntries.length === 0 ? "還沒寫" : `已寫 ${todayEntries.length} 篇`}
          </span>
        </div>
        <Link
          href={`/journal/${today}`}
          className="text-sm bg-[var(--color-ink)] text-white px-4 py-2 rounded-[var(--radius-button)] hover:bg-[var(--color-ink-mid)] transition"
        >
          {todayEntries.length === 0 ? "寫今天" : "查看"}
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">
            {yyyy} 年 {mm} 月
          </h2>
          <span className="text-xs text-[var(--color-ink-soft)]">點任一天打開</span>
        </header>
        <JournalCalendar year={yyyy} month={mm} stats={stats} />
      </section>
    </div>
  );
}
