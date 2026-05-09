import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  getJournalMonthSummary,
  getJournalEntriesOfDate,
  getRecentJournalEntries,
} from "@/lib/journal/queries";
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
  const wd = String(now.getDay());

  const [stats, todayEntries, recent] = await Promise.all([
    getJournalMonthSummary(user.id, yyyy, mm),
    getJournalEntriesOfDate(user.id, today),
    getRecentJournalEntries(user.id, 6),
  ]);

  // 本月匯總
  let monthDays = 0;
  let monthEntries = 0;
  let monthPhotoDays = 0;
  for (const s of stats.values()) {
    monthDays += 1;
    monthEntries += s.count;
    if (s.hasPhotos) monthPhotoDays += 1;
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ─── 標題 ─── */}
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Journal
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("journal.title")}</h1>
      </header>

      {/* ─── 今天 hero ─── */}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/journal/${today}` as any}
        className="surface px-5 py-5 flex items-center justify-between gap-3 active:bg-[var(--color-paper-dim)] transition-colors"
      >
        <div className="flex flex-col min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            {t("common.today")} · {now.getMonth() + 1}/{now.getDate()} ·{" "}
            {t(`weekday.${wd}` as "weekday.0")}
          </p>
          <p className="font-serif text-2xl mt-1 leading-tight truncate">
            {todayEntries.length === 0
              ? t("journal.today_unwritten")
              : t("journal.today_n_entries", { n: todayEntries.length })}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-ink)] text-white text-lg">
          {todayEntries.length === 0 ? "+" : "→"}
        </span>
      </Link>

      {/* ─── 本月精簡數據 ─── */}
      <section className="grid grid-cols-3 gap-2 border-b border-[var(--color-paper-line)] pb-5">
        <SmallStat
          label={t("memories.stat_wrote_together")}
          value={monthDays}
          unit={t("memories.unit_days")}
        />
        <SmallStat
          label={t("memories.stat_total")}
          value={monthEntries}
          unit={t("memories.unit_entries")}
        />
        <SmallStat
          label="有照片"
          value={monthPhotoDays}
          unit={t("memories.unit_days")}
        />
      </section>

      {/* ─── 最近寫的 timeline ─── */}
      {recent.length > 0 ? (
        <section className="flex flex-col gap-3">
          <header className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl">最近寫的</h2>
            <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
              {recent.length}
            </span>
          </header>
          <ul className="flex flex-col gap-3">
            {recent.map((e) => (
              <RecentEntryRow key={e.id} entry={e} t={t} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-[var(--color-ink-soft)] text-center py-6">
          {t("journal.empty")}
        </p>
      )}

      {/* ─── 月曆(收摺) ─── */}
      <details className="group border-y border-[var(--color-paper-line)] py-1">
        <summary className="list-none cursor-pointer flex items-baseline justify-between py-3 select-none">
          <h2 className="font-serif text-xl">
            {t("common.year_month", { y: yyyy, m: mm })}
          </h2>
          <span
            className="text-[var(--color-ink-soft)] text-xl leading-none group-open:rotate-45 transition-transform"
            aria-hidden
          >
            +
          </span>
        </summary>
        <div className="pb-4 pt-1">
          <JournalCalendar year={yyyy} month={mm} stats={stats} />
        </div>
      </details>
    </div>
  );
}

function SmallStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] truncate">
        {label}
      </span>
      <div className="font-serif text-2xl tabular-nums mt-1">
        {value}
        <span className="text-sm text-[var(--color-ink-mid)] ml-1">{unit}</span>
      </div>
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

interface EntryLike {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  signed_photo_urls: string[];
}

function RecentEntryRow({ entry, t }: { entry: EntryLike; t: T }) {
  const d = new Date(`${entry.date}T00:00:00`);
  const wd = String(d.getDay());
  const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
  const snippet = (entry.content ?? "").trim();
  const limited = snippet.length > 80 ? snippet.slice(0, 80) + "…" : snippet;

  return (
    <li>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/journal/${entry.date}` as any}
        className="block surface px-4 py-3.5 active:bg-[var(--color-paper-dim)] transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-serif text-base text-[var(--color-ink)] tabular-nums shrink-0">
              {monthDay}
            </span>
            <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider shrink-0">
              {t(`weekday.${wd}` as "weekday.0")}
            </span>
            {entry.shared_with_partner && (
              <span className="text-[10px] text-[var(--color-accent-deep)] uppercase tracking-wider shrink-0">
                · {t("journal.shared")}
              </span>
            )}
          </div>
          <span className="text-[var(--color-ink-soft)] shrink-0">→</span>
        </div>
        {limited && (
          <p className="text-sm text-[var(--color-ink-mid)] mt-2 leading-relaxed line-clamp-2">
            {limited}
          </p>
        )}
        {entry.signed_photo_urls.length > 0 && (
          <div className="flex gap-1 mt-3">
            {entry.signed_photo_urls.slice(0, 4).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-14 h-14 object-cover rounded-md bg-[var(--color-paper-dim)]"
              />
            ))}
            {entry.signed_photo_urls.length > 4 && (
              <div className="w-14 h-14 rounded-md bg-[var(--color-paper-dim)] flex items-center justify-center text-xs text-[var(--color-ink-mid)] tabular-nums">
                +{entry.signed_photo_urls.length - 4}
              </div>
            )}
          </div>
        )}
        {!limited && entry.signed_photo_urls.length === 0 && (
          <p className="text-xs text-[var(--color-ink-soft)] italic mt-2">
            {t("journal.only_photos")}
          </p>
        )}
      </Link>
    </li>
  );
}
