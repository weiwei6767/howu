import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireUser, getActiveCouple, getPartnerProfile } from "@/lib/supabase/auth";
import {
  getJournalEntriesOfDate,
  getPartnerSharedOfDate,
  type JournalEntryFull,
} from "@/lib/journal/queries";
import { DayView, type EntryRow } from "@/components/journal/DayView";
import { Sparkle } from "@/components/ui/Ornaments";

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
  const couple = await getActiveCouple(user.id);
  const partnerId = couple
    ? couple.partner_a_id === user.id
      ? couple.partner_b_id
      : couple.partner_a_id
    : null;

  const [entries, partnerShared, partnerProfile] = await Promise.all([
    getJournalEntriesOfDate(user.id, date),
    partnerId ? getPartnerSharedOfDate(partnerId, date) : Promise.resolve([]),
    couple ? getPartnerProfile(user.id, couple) : Promise.resolve(null),
  ]);
  const items: EntryRow[] = entries.map((e) => ({
    id: e.id,
    date: e.date,
    content: e.content,
    shared_with_partner: e.shared_with_partner,
    created_at: e.created_at,
    photos: e.photos.map((p) => ({ path: p.path })),
    signedUrls: e.signed_photo_urls,
  }));

  const partnerName = partnerProfile?.display_name ?? "對方";

  const d = new Date(date);
  const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const wd = String(d.getDay());

  return (
    <div className="flex flex-col gap-6">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/journal" as any}
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

      {partnerId && (
        <section className="flex flex-col gap-4 mt-2">
          <header className="flex items-center justify-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-[var(--color-accent-deep)]">
              <Sparkle className="w-3 h-3 text-[var(--color-accent)]/70" />
              {partnerName} 這天分享給你
            </span>
            <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
          </header>
          {partnerShared.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/25 px-5 py-7 text-center flex flex-col items-center gap-1.5">
              <span
                className="text-[var(--color-accent-deep)]/70"
                style={{
                  fontFamily: "var(--font-caveat), Georgia, serif",
                  fontSize: "1.1rem",
                }}
              >
                {partnerName} 這天沒有分享給你
              </span>
              <span className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                對方有寫並勾「分享給對方」才會出現
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {partnerShared.map((e) => (
                <PartnerSharedFull key={e.id} entry={e} authorName={partnerName} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function PartnerSharedFull({
  entry,
  authorName,
}: {
  entry: JournalEntryFull;
  authorName: string;
}) {
  const time = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  return (
    <article className="rounded-[14px] bg-gradient-to-br from-[var(--color-accent-soft)]/45 to-white border border-[var(--color-accent)]/25 px-4 py-4 shadow-[0_4px_18px_-8px_rgba(184,50,77,0.18)]">
      <header className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent-deep)]">
          ✦ from {authorName}
        </span>
        <span>{time}</span>
      </header>

      {entry.signed_photo_urls.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            entry.signed_photo_urls.length === 1
              ? "grid-cols-1"
              : entry.signed_photo_urls.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {entry.signed_photo_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-square object-cover bg-[var(--color-paper-dim)] rounded-md"
            />
          ))}
        </div>
      )}
      <p
        className="text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap"
        style={{
          fontFamily: "var(--font-caveat), Georgia, serif",
          fontSize: "1.15rem",
        }}
      >
        {entry.content || (
          <span className="text-[var(--color-ink-soft)] italic">這篇只有照片</span>
        )}
      </p>
    </article>
  );
}
