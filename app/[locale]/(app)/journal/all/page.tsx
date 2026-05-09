import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { getRecentJournalEntries, type JournalEntryFull } from "@/lib/journal/queries";

export default async function JournalAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  // 抓最近 365 篇,該日記時間區間的 sort 已是 date desc + created_at desc
  const entries = await getRecentJournalEntries(user.id, 365);

  // 依年份 → 月份 分組
  type Group = { ym: string; year: number; month: number; entries: JournalEntryFull[] };
  const groupMap = new Map<string, Group>();
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    const [y, m] = ym.split("-");
    const g = groupMap.get(ym) ?? {
      ym,
      year: Number(y),
      month: Number(m),
      entries: [],
    };
    g.entries.push(e);
    groupMap.set(ym, g);
  }
  const groups = Array.from(groupMap.values());

  return (
    <div className="flex flex-col gap-7">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/journal" as any}
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] self-start"
      >
        ← {t("journal.title")}
      </Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Past Entries
        </p>
        <h1 className="font-serif text-3xl mt-1">過去的日記</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2">
          總共 {entries.length} 篇
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">
          {t("journal.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.ym} className="flex flex-col gap-3">
              <h2 className="font-serif text-xl border-b border-[var(--color-paper-line)] pb-2">
                {t("common.year_month", { y: g.year, m: g.month })}
              </h2>
              <ul className="flex flex-col gap-3">
                {g.entries.map((e) => (
                  <EntryListRow key={e.id} entry={e} t={t} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function EntryListRow({ entry, t }: { entry: JournalEntryFull; t: T }) {
  const d = new Date(`${entry.date}T00:00:00`);
  const wd = String(d.getDay());
  const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
  const snippet = (entry.content ?? "").trim();
  const limited = snippet.length > 100 ? snippet.slice(0, 100) + "…" : snippet;

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
          <p className="text-sm text-[var(--color-ink-mid)] mt-2 leading-relaxed line-clamp-3">
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
