import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/memories/PhotoGrid";
import { PhotoUploadTile } from "@/components/memories/PhotoUploadTile";
import { Sparkle, ArcUnderline } from "@/components/ui/Ornaments";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

interface ResponseRow {
  date: string;
  responder_id: string;
}

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const monthStart = new Date(yyyy, mm - 1, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(yyyy, mm, 0).toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id")
    .eq("couple_id", couple.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  const dayResponders = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = dayResponders.get(r.date) ?? new Set();
    set.add(r.responder_id);
    dayResponders.set(r.date, set);
  }
  const daysBothDone = Array.from(dayResponders.values()).filter(
    (s) => s.size === 2,
  ).length;
  const totalEntries = responses.length;

  // 取最近 12 張(過濾 bg 後選前 5)
  const { data: rawPhotos } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);
  const usablePhotos = ((rawPhotos as PhotoRow[] | null) ?? []).filter(
    (p) => p.url && !p.url.includes("/bg/"),
  );

  // 排除 bg 的全站總張數
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalUsableRaw } = await (supabase as any)
    .from("shared_photos")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", couple.id)
    .not("url", "ilike", "%/bg/%");
  const totalCount = (totalUsableRaw as number | null) ?? usablePhotos.length;

  const signed = usablePhotos.slice(0, 5).map((p) => ({
    id: p.id,
    url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    caption: p.caption,
  }));
  const hasMore = totalCount > 5;

  const ymLabel = `${yyyy}-${String(mm).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-7">
      <header className="relative">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("memories.section_title")}
        </p>
        <h1 className="font-serif text-3xl mt-1 inline-block relative">
          {t("memories.title")}
          <ArcUnderline className="absolute -bottom-1 left-0 w-full h-2 text-[var(--color-accent)]/60" />
        </h1>
      </header>

      {/* 月度小數據 */}
      {totalEntries > 0 ? (
        <section className="grid grid-cols-3 gap-2 border-b border-[var(--color-paper-line)] pb-5">
          <Stat
            label={t("memories.stat_wrote_together")}
            value={daysBothDone}
            unit={t("memories.unit_days")}
          />
          <Stat
            label={t("memories.stat_total")}
            value={totalEntries}
            unit={t("memories.unit_entries")}
          />
          <Stat label={ymLabel} value={totalCount} unit="" hideUnit hint />
        </section>
      ) : (
        <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
          {t("memories.month_no_entries_yet")}
        </p>
      )}

      {/* 主要兩個入口:過去的問卷 + 我們的回憶冊 */}
      <div className="flex flex-col gap-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/memories/history" as any}
          className="surface px-5 py-4 flex items-center justify-between active:bg-[var(--color-paper-dim)] transition-colors"
        >
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight truncate">
              {t("memories.history_title")}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1 truncate">
              {t("memories.history_subtitle")}
            </p>
          </div>
          <span className="text-[var(--color-ink-soft)] shrink-0 ml-3 text-lg">→</span>
        </Link>

        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/memories/book" as any}
          className="relative overflow-hidden rounded-[var(--radius-card)] text-white px-5 py-6 flex items-center justify-between active:opacity-90 transition-opacity"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #8a3a4d 0%, #6a2837 55%, #4a1a2a 100%)",
            boxShadow:
              "0 12px 32px -12px rgba(106, 40, 55, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* 角落星星裝飾 */}
          <Sparkle className="absolute top-3 right-4 w-3 h-3 text-white/40" />
          <Sparkle className="absolute bottom-4 right-12 w-2 h-2 text-white/25" />
          <div className="min-w-0 relative">
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/60 mb-1">
              Memory Book
            </p>
            <p className="font-serif text-2xl leading-tight truncate">
              {t("memories.title")}
            </p>
            <p className="text-xs text-white/70 mt-1 truncate">
              {t("memories.memory_book_sub")}
            </p>
          </div>
          <span className="shrink-0 ml-3 text-lg">→</span>
        </Link>
      </div>

      {/* 共同相簿 */}
      <section className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">{t("memories.albums")}</h2>
          {totalCount > 0 && (
            <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
              {totalCount}
            </span>
          )}
        </header>

        <div className="grid grid-cols-3 gap-3">
          <PhotoUploadTile coupleId={couple.id} />
          <PhotoGrid photos={signed} />
        </div>

        {signed.length === 0 && (
          <p className="text-xs text-[var(--color-ink-soft)] text-center pt-2">
            {t("us_week.moments_empty")}
          </p>
        )}

        {hasMore && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/memories/album" as any}
            className="self-end inline-flex items-center gap-1 text-sm text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] underline underline-offset-2 mt-1"
          >
            查看更多 ({totalCount}) →
          </Link>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hideUnit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hideUnit?: boolean;
  hint?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] truncate">
        {label}
      </span>
      <div className="font-serif text-2xl tabular-nums mt-1">
        {value}
        {!hideUnit && (
          <span className="text-sm text-[var(--color-ink-mid)] ml-1">{unit}</span>
        )}
        {hint && (
          <span className="text-[10px] text-[var(--color-ink-soft)] ml-1 uppercase">
            photos
          </span>
        )}
      </div>
    </div>
  );
}
