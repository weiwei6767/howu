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
  const dateLabel = `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${weekdays[d.getDay()]}`;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/journal" className="text-sm text-zinc-500">
        ← {yearMonth}
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{dateLabel}</h1>
        <p className="text-sm text-zinc-500">
          {items.length === 0
            ? "這天還沒寫"
            : `寫了 ${items.length} 篇`}
        </p>
      </header>
      <DayView userId={user.id} date={date} entries={items} />
    </div>
  );
}
