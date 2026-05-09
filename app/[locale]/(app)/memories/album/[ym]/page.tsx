import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/memories/PhotoGrid";
import { PhotoUploadTile } from "@/components/memories/PhotoUploadTile";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string | null;
}

function isValidYm(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}

function getMonday(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ymdISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AlbumMonthPage({
  params,
}: {
  params: Promise<{ locale: string; ym: string }>;
}) {
  const { locale, ym } = await params;
  setRequestLocale(locale);
  if (!isValidYm(ym)) notFound();
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  const [yyyy, mm] = ym.split("-").map(Number);
  const monthStart = new Date(yyyy, mm - 1, 1);
  const monthEnd = new Date(yyyy, mm, 0);
  const startISO = ymdISO(monthStart);
  const endISO = ymdISO(monthEnd);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPhotos } = await (supabase as any)
    .from("shared_photos")
    .select("id, url, caption, taken_at, created_at")
    .eq("couple_id", couple.id)
    .gte("taken_at", startISO)
    .lte("taken_at", endISO)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  const photos = ((rawPhotos as PhotoRow[] | null) ?? []).filter(
    (p) => p.url && !p.url.includes("/bg/"),
  );

  // 依「週」分組(週一為起點)
  type WeekGroup = {
    mondayISO: string;
    monday: Date;
    sunday: Date;
    photos: PhotoRow[];
  };
  const weekMap = new Map<string, WeekGroup>();
  for (const p of photos) {
    const date = (p.taken_at ?? p.created_at ?? "").slice(0, 10);
    if (!date) continue;
    const monday = getMonday(date);
    const key = ymdISO(monday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const cur =
      weekMap.get(key) ?? { mondayISO: key, monday, sunday, photos: [] };
    cur.photos.push(p);
    weekMap.set(key, cur);
  }
  const weeks = Array.from(weekMap.values()).sort((a, b) =>
    a.mondayISO < b.mondayISO ? 1 : -1,
  );

  // 算當前真實「本週」(Asia/Taipei)
  const tpNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }),
  );
  const tpToday = ymdISO(tpNow);
  const thisMonday = ymdISO(getMonday(tpToday));

  return (
    <div className="flex flex-col gap-7">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/memories/album" as any}
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] self-start"
      >
        ← {t("memories.albums")}
      </Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {ym}
        </p>
        <h1 className="font-serif text-3xl mt-1">
          {t("common.year_month", { y: yyyy, m: mm })}
        </h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2 tabular-nums">
          {photos.length} 張 · {weeks.length} 週
        </p>
      </header>

      {weeks.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-ink-soft)] py-6 text-center">
            這個月還沒有照片
          </p>
          <div className="grid grid-cols-3 gap-3">
            <PhotoUploadTile coupleId={couple.id} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeks.map((wk) => {
            const isThisWeek = wk.mondayISO === thisMonday;
            const signed = wk.photos.map((p) => ({
              id: p.id,
              url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
              caption: p.caption,
            }));
            return (
              <section key={wk.mondayISO} className="flex flex-col gap-3">
                <header className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-serif text-xl">
                      {fmt(wk.monday)} – {fmt(wk.sunday)}
                    </h2>
                    {isThisWeek && (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent-deep)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-full">
                        本週
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
                    {wk.photos.length} 張
                  </span>
                </header>
                <div className="grid grid-cols-3 gap-3">
                  {isThisWeek && <PhotoUploadTile coupleId={couple.id} />}
                  <PhotoGrid photos={signed} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
