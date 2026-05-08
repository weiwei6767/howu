import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getJournalEntriesOfDate } from "@/lib/journal/queries";
import { DayView, type EntryRow } from "@/components/journal/DayView";

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function JournalDatePage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);
  if (!isValidDate(date)) notFound();

  const user = await requireUser();
  const entries = await getJournalEntriesOfDate(user.id, date);
  const items: EntryRow[] = entries.map((e) => ({
    id: e.id,
    date: e.date,
    content: e.content,
    shared_with_partner: e.shared_with_partner,
    created_at: e.created_at,
    photos: e.photos.map((p) => ({ path: p.path })),
    signedUrls: e.signed_photo_urls,
  }));

  const d = new Date(date);
  const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/journal"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← {yearMonth}
      </Link>
      <header className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {d.getFullYear()}.{String(d.getMonth() + 1).padStart(2, "0")}.{String(d.getDate()).padStart(2, "0")}
        </p>
        <h1 className="font-serif text-3xl">
          {d.getMonth() + 1} 月 {d.getDate()} 日
        </h1>
        <p className="text-sm text-[var(--color-ink-mid)]">
          星期{weekdays[d.getDay()]} ·{" "}
          {items.length === 0 ? "這天還沒寫" : `已寫 ${items.length} 篇`}
        </p>
      </header>
      <DayView userId={user.id} date={date} entries={items} />
    </div>
  );
}
