import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

interface MonthlyInsight {
  year: number;
  month: number;
  days_done: number;
  sync_delta: number;
  top_mood_tags: Array<{ tag: string; count: number }>;
  best_day: { date: string; score: number } | null;
  avg_happiness: number;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insightRaw } = await (supabase as any).rpc("monthly_insight", {
    p_couple_id: couple.id,
    p_year: yyyy,
    p_month: mm,
  });
  const insight = insightRaw as MonthlyInsight | null;

  const { data: rawPhotos } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  const photos = ((rawPhotos as PhotoRow[] | null) ?? []).filter((p) => p.url);

  const signed = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from("shared_photos")
        .createSignedUrl(p.url, 60 * 60 * 6);
      return { id: p.id, url: data?.signedUrl ?? "", caption: p.caption };
    }),
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("memories.title")}</h1>

      {/* 月度 insight */}
      {insight && insight.days_done > 0 ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">
              {t("memories.monthly", { ym: `${yyyy}-${String(mm).padStart(2, "0")}` })}
            </span>
            <Badge tone="rose">+{insight.sync_delta} 默契</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="完成天數" value={`${insight.days_done}`} />
            <Stat label="平均幸福" value={`${insight.avg_happiness}`} />
            <Stat label="默契成長" value={`+${insight.sync_delta}`} />
          </div>
          {insight.top_mood_tags?.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500">這個月最常出現:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {insight.top_mood_tags.map((m) => (
                  <Badge key={m.tag} tone="rose">
                    #{m.tag} × {m.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {insight.best_day && (
            <p className="text-xs text-zinc-500">
              ✨ 這個月最棒的一天:<span className="font-medium">{insight.best_day.date}</span>
            </p>
          )}
        </Card>
      ) : (
        <Card className="text-sm text-zinc-500">
          這個月還沒累積夠多紀錄,寫滿一週問卷後就會出現月度回顧。
        </Card>
      )}

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
