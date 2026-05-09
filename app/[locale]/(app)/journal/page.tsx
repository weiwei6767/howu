import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  getJournalEntriesOfDate,
  getRecentJournalEntries,
  getJournalMonthSummary,
} from "@/lib/journal/queries";
import { Sparkle, ArcUnderline, HeartScribble } from "@/components/ui/Ornaments";

const SERIF = 'Georgia, "Source Serif Pro", "Noto Serif TC", serif';

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
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;

  const [todayEntries, recent, monthStats] = await Promise.all([
    getJournalEntriesOfDate(user.id, today),
    getRecentJournalEntries(user.id, 5),
    getJournalMonthSummary(user.id, yyyy, mm),
  ]);

  const monthDays = monthStats.size;

  return (
    <div className="flex flex-col gap-8">
      {/* ─── 標題 ─── */}
      <header className="relative">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
          Journal
        </p>
        <h1 className="font-serif text-3xl mt-1 inline-block relative">
          {t("journal.title")}
          <ArcUnderline className="absolute -bottom-1 left-0 w-full h-2 text-[var(--color-accent)]/55" />
        </h1>
      </header>

      {/* ─── 今天 大日曆頁式 hero ─── */}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/journal/${today}` as any}
        className="relative overflow-hidden rounded-[20px] border border-[var(--color-accent)]/25 bg-gradient-to-br from-white via-[var(--color-accent-soft)]/40 to-white active:opacity-95 transition-opacity"
      >
        <Sparkle className="absolute top-3 right-4 w-3 h-3 text-[var(--color-accent)]/55" />
        <Sparkle className="absolute bottom-3 left-4 w-2.5 h-2.5 text-[var(--color-accent)]/35" />

        <div className="px-5 py-6 flex items-center gap-5">
          {/* 左:大日 */}
          <div className="flex flex-col items-center text-center shrink-0 w-[88px]">
            <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-accent-deep)]">
              {now.toLocaleString("en", { month: "short" })}
            </span>
            <span
              className="leading-none italic text-[var(--color-accent-deep)] tabular-nums"
              style={{ fontFamily: SERIF, fontSize: "5.5rem", letterSpacing: "-0.03em" }}
            >
              {now.getDate()}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-mid)] mt-1">
              {t(`weekday.${wd}` as "weekday.0")}
            </span>
          </div>

          {/* 右:狀態 + 行為 */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p
              className="text-[var(--color-ink)] leading-tight"
              style={{ fontFamily: "var(--font-caveat), Georgia, serif", fontSize: "1.5rem" }}
            >
              {todayEntries.length === 0 ? "今天,還沒寫" : `今天寫了 ${todayEntries.length} 篇`}
            </p>
            <p className="text-xs text-[var(--color-ink-mid)] leading-relaxed">
              {todayEntries.length === 0
                ? "把今天記下來吧,一句話也好。"
                : "點開繼續寫或加照片。"}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent)] text-white text-base shadow-[0_4px_14px_-4px_rgba(184,50,77,0.5)]">
                {todayEntries.length === 0 ? "+" : "→"}
              </span>
              {monthDays > 0 && (
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-mid)] tabular-nums ml-1">
                  本月 {monthDays} 天
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* ─── 最近寫的 timeline ─── */}
      {recent.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="flex items-center justify-center gap-3">
            <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
              <HeartScribble className="w-3.5 h-3.5 text-[var(--color-accent)]/60" />
              最近寫的
            </span>
            <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
          </header>

          <ul className="flex flex-col gap-4">
            {recent.map((e, i) => (
              <RecentEntryCard key={e.id} entry={e} index={i} t={t} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-[var(--color-ink-soft)] text-center py-6 italic">
          {t("journal.empty")}
        </p>
      )}

      {/* ─── 過去的日記入口 ─── */}
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

function RecentEntryCard({
  entry,
  index,
  t,
}: {
  entry: EntryLike;
  index: number;
  t: T;
}) {
  const d = new Date(`${entry.date}T00:00:00`);
  const wd = String(d.getDay());
  const monthDay = `${d.getMonth() + 1}.${d.getDate()}`;
  const snippet = (entry.content ?? "").trim();
  const limited = snippet.length > 90 ? snippet.slice(0, 90) + "…" : snippet;

  // 卡片微微交錯傾斜增加紙感
  const tilt = index % 2 === 0 ? "rotate-[-0.3deg]" : "rotate-[0.3deg]";

  return (
    <li>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/journal/${entry.date}` as any}
        className={`block relative bg-white rounded-[14px] px-4 py-4 shadow-[0_4px_18px_-8px_rgba(40,25,30,0.18),0_1px_2px_rgba(40,25,30,0.06)] hover:scale-[1.01] hover:rotate-0 active:scale-[0.99] transition-transform ${tilt}`}
      >
        {/* 上方手寫日期標籤 */}
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="text-[var(--color-accent-deep)] leading-none"
            style={{
              fontFamily: "var(--font-caveat), Georgia, serif",
              fontSize: "1.4rem",
            }}
          >
            {monthDay}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            {t(`weekday.${wd}` as "weekday.0")}
          </span>
          {entry.shared_with_partner && (
            <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-accent-deep)]">
              已分享
            </span>
          )}
        </div>

        {/* 內容 */}
        {limited ? (
          <p
            className="text-[var(--color-ink)] leading-relaxed line-clamp-2"
            style={{ fontFamily: "var(--font-caveat), Georgia, serif", fontSize: "1.1rem" }}
          >
            {limited}
          </p>
        ) : entry.signed_photo_urls.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-soft)] italic">
            (這篇沒寫文字)
          </p>
        ) : null}

        {/* Polaroid 縮圖橫排 */}
        {entry.signed_photo_urls.length > 0 && (
          <div className="flex gap-1.5 mt-3 overflow-hidden">
            {entry.signed_photo_urls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                className="bg-white p-1 pb-2 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.18)]"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 object-cover bg-[var(--color-paper-dim)]"
                />
              </div>
            ))}
            {entry.signed_photo_urls.length > 4 && (
              <div
                className="w-12 h-[60px] bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] flex items-center justify-center text-xs text-[var(--color-ink-mid)] tabular-nums shrink-0"
                style={{ transform: "rotate(1deg)" }}
              >
                +{entry.signed_photo_urls.length - 4}
              </div>
            )}
          </div>
        )}

        {/* 右下小箭頭 */}
        <span className="absolute bottom-3 right-3 text-[var(--color-ink-soft)] text-sm">
          →
        </span>
      </Link>
    </li>
  );
}
