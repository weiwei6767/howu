import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
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
  const t = await getTranslations();
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
  const wd = String(d.getDay());

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
          {d.getFullYear()}.{String(d.getMonth() + 1).padStart(2, "0")}.
          {String(d.getDate()).padStart(2, "0")}
        </p>
        <h1 className="font-serif text-3xl">
          {t("common.month_day", { m: d.getMonth() + 1, d: d.getDate() })}
        </h1>
        <p className="text-sm text-[var(--color-ink-mid)]">
          {t(`weekday.${wd}` as "weekday.0")} ·{" "}
          {items.length === 0
            ? t("journal.day_no_entry")
            : t("journal.today_n_entries", { n: items.length })}
        </p>
      </header>
      <DayView userId={user.id} date={date} entries={items} />
    </div>
  );
}
