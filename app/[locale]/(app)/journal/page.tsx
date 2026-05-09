import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  getJournalEntriesOfDate,
  getRecentJournalEntries,
} from "@/lib/journal/queries";

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
  const today = now.toISOString().slice(0, 10);
  const wd = String(now.getDay());

  const [todayEntries, recent] = await Promise.all([
    getJournalEntriesOfDate(user.id, today),
    getRecentJournalEntries(user.id, 3),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Journal
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("journal.title")}</h1>
      </header>

      {/* 今天 hero */}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/journal/${today}` as any}
        className="rounded-[var(--radius-card)] border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-soft)]/60 to-white px-5 py-5 flex items-center justify-between gap-3 active:opacity-90 transition-opacity"
      >
        <div className="flex flex-col min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-deep)]">
            {t("common.today")} · {now.getMonth() + 1}/{now.getDate()} ·{" "}
            {t(`weekday.${wd}` as "weekday.0")}
          </p>
          <p className="font-serif text-2xl mt-1 leading-tight truncate">
            {todayEntries.length === 0
              ? t("journal.today_unwritten")
              : t("journal.today_n_entries", { n: todayEntries.length })}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent)] text-white text-lg shadow-[0_4px_16px_-4px_rgba(184,50,77,0.5)]">
          {todayEntries.length === 0 ? "+" : "→"}
        </span>
      </Link>

      {/* 最近寫的(3 篇) */}
      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl">最近寫的</h2>
          <ul className="flex flex-col gap-3">
            {recent.map((e) => (
              <RecentEntryRow key={e.id} entry={e} t={t} />
            ))}
          </ul>
        </section>
      )}

      {/* 過去的日記入口 */}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/journal/all" as any}
        className="flex items-center justify-between py-4 border-y border-[var(--color-paper-line)] hover:text-[var(--color-ink-mid)] transition-colors"
      >
        <div>
          <p className="font-serif text-lg leading-tight">過去的日記</p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
            依日期排序,看你寫過的所有日記
          </p>
        </div>
        <span className="text-[var(--color-ink-soft)] text-lg">→</span>
      </Link>
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
