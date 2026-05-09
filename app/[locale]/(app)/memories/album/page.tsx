import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoUploadTile } from "@/components/memories/PhotoUploadTile";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string | null;
}

export default async function AlbumByMonthPage({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPhotos } = await (supabase as any)
    .from("shared_photos")
    .select("id, url, caption, taken_at, created_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);

  const photos = ((rawPhotos as PhotoRow[] | null) ?? []).filter(
    (p) => p.url && !p.url.includes("/bg/"),
  );

  // 依年-月分組(用 taken_at,沒有就用 created_at)
  type MonthGroup = { ym: string; year: number; month: number; count: number };
  const monthMap = new Map<string, MonthGroup & { sample: PhotoRow | null }>();
  for (const p of photos) {
    const date = (p.taken_at ?? p.created_at ?? "").slice(0, 10);
    if (!date) continue;
    const ym = date.slice(0, 7);
    const [y, m] = ym.split("-");
    const cur = monthMap.get(ym) ?? {
      ym,
      year: Number(y),
      month: Number(m),
      count: 0,
      sample: null,
    };
    cur.count += 1;
    if (!cur.sample) cur.sample = p;
    monthMap.set(ym, cur);
  }
  const months = Array.from(monthMap.values());

  return (
    <div className="flex flex-col gap-7">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/memories" as any}
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] self-start"
      >
        ← {t("memories.section_title")}
      </Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Album
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("memories.albums")}</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2">
          總共 {photos.length} 張
        </p>
      </header>

      {/* 上傳 */}
      <div className="grid grid-cols-3 gap-3">
        <PhotoUploadTile coupleId={couple.id} />
        <p className="col-span-2 self-center text-xs text-[var(--color-ink-soft)] leading-relaxed pl-2">
          上傳一張新照片到共同相簿
        </p>
      </div>

      {months.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">
          還沒有任何照片
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {months.map((mo) => {
            const sampleUrl = mo.sample
              ? `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(mo.sample.url)}`
              : null;
            return (
              <li key={mo.ym}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/memories/album/${mo.ym}` as any}
                  className="surface px-3 py-3 flex items-center gap-4 active:bg-[var(--color-paper-dim)] transition-colors"
                >
                  {/* 縮圖 */}
                  <div className="w-16 h-16 shrink-0 bg-[var(--color-paper-dim)] overflow-hidden rounded-md relative">
                    {sampleUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sampleUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-xl leading-tight">
                      {t("common.year_month", { y: mo.year, m: mo.month })}
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5 tabular-nums">
                      {mo.count} 張
                    </p>
                  </div>
                  <span className="text-[var(--color-ink-soft)] shrink-0">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
