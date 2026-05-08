import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMilestones } from "@/lib/supabase/queries";
import { nextSpecialDays, daysUntil } from "@/lib/special-days";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/memories/PhotoUpload";
import { PhotoGrid } from "@/components/memories/PhotoGrid";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

interface ResponseRow {
  date: string;
  responder_id: string;
  template_id: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  emoji: string | null;
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

  // 拉這個月所有問卷
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id, template_id")
    .eq("couple_id", couple.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  // 算雙方都完成的天數
  const dayResponders = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = dayResponders.get(r.date) ?? new Set();
    set.add(r.responder_id);
    dayResponders.set(r.date, set);
  }
  const daysBothDone = Array.from(dayResponders.values()).filter((s) => s.size === 2).length;
  const totalEntries = responses.length;

  // 算最常選的模板(用 template_id 計數)
  const templateCount = new Map<string, number>();
  for (const r of responses) {
    if (!r.template_id) continue;
    templateCount.set(r.template_id, (templateCount.get(r.template_id) ?? 0) + 1);
  }
  const topTemplateIds = Array.from(templateCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  // 拉模板資訊
  let topTemplates: Array<TemplateRow & { count: number }> = [];
  if (topTemplateIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tplsRaw } = await (supabase as any)
      .from("templates")
      .select("id, name, emoji")
      .in("id", topTemplateIds);
    const tplMap = new Map<string, TemplateRow>(
      ((tplsRaw as TemplateRow[] | null) ?? []).map((t) => [t.id, t]),
    );
    topTemplates = topTemplateIds
      .map((id) => {
        const t = tplMap.get(id);
        return t ? { ...t, count: templateCount.get(id) ?? 0 } : null;
      })
      .filter((x): x is TemplateRow & { count: number } => !!x);
  }

  const { data: rawPhotos } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  const photos = ((rawPhotos as PhotoRow[] | null) ?? [])
    .filter((p) => p.url && !p.url.includes("/bg/"));

  const signed = photos.map((p) => ({
    id: p.id,
    url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    caption: p.caption,
  }));

  const milestones = await getMilestones(couple.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("memories.title")}</h1>

      {totalEntries > 0 ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">
              {t("memories.monthly", { ym: `${yyyy}-${String(mm).padStart(2, "0")}` })}
            </span>
            <Badge tone="rose">{totalEntries} 份</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="一起寫了" value={`${daysBothDone} 天`} />
            <Stat label="總共寫了" value={`${totalEntries} 份`} />
          </div>
          {topTemplates.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500">這個月最常選的模板:</span>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {topTemplates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{t.emoji ?? "📝"}</span>
                    <span className="flex-1">{t.name}</span>
                    <Badge tone="neutral">× {t.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="text-sm text-zinc-500">
          這個月還沒累積夠多紀錄,寫滿一週後就會出現月度回顧。
        </Card>
      )}

      {/* 為什麼要上傳照片 + 下次特殊日子 */}
      <SpecialDaysCallout coupleId={couple.id} milestones={milestones} />

      <Link
        href="/memories/book"
        className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] px-4 py-3 flex items-center gap-3"
      >
        <span className="text-2xl">📖</span>
        <div className="flex-1">
          <div className="text-sm font-semibold">我們的回憶冊</div>
          <div className="text-xs text-zinc-500">列印 / 存 PDF 留念</div>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      <PhotoUpload coupleId={couple.id} />

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t("memories.albums")}</h2>
        {signed.length === 0 ? (
          <Card className="text-center text-sm text-zinc-400 py-6">{t("journal.empty")}</Card>
        ) : (
          <PhotoGrid photos={signed.filter((s) => s.url)} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-zinc-50 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-xl font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function SpecialDaysCallout({
  coupleId: _coupleId,
  milestones,
}: {
  coupleId: string;
  milestones: Array<{
    id: string;
    title: string;
    date: string;
    recurring: boolean | null;
    type: string | null;
  }>;
}) {
  const upcoming = nextSpecialDays(
    milestones.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      recurring: m.recurring,
      type: m.type,
    })),
    3,
  );
  const next = upcoming[0];
  return (
    <Card className="bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50 border border-rose-100 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">🎞️</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">為什麼要上傳照片?</h3>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
            到了情人節 · 520 · 七夕 · 紀念日 · 生日 那天,
            howu 會把你們上傳的照片做成
            <span className="font-medium text-[var(--color-rose)]"> 拍立得翻頁回憶幻燈片</span>
            ,有背景音樂、有手寫日期。
          </p>
        </div>
      </div>
      {next && (
        <div className="flex items-center justify-between bg-white/70 rounded-md px-3 py-2">
          <div>
            <p className="text-[11px] text-zinc-500">下次特殊日</p>
            <p className="text-sm font-medium">
              {next.emoji} {next.name}
              <span className="text-xs text-zinc-500 ml-2">
                還有 {Math.max(0, daysUntil(next.date))} 天
              </span>
            </p>
          </div>
          <Link
            href={`/memories/slideshow?occasion=${next.id}`}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-rose)] text-white font-medium"
          >
            預覽 →
          </Link>
        </div>
      )}
      {!next && (
        <Link
          href="/memories/slideshow"
          className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-rose)] text-white font-medium self-start"
        >
          現在就看 →
        </Link>
      )}
    </Card>
  );
}
