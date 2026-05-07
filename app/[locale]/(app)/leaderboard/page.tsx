import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ScoreRow {
  couple_id: string;
  total_score: number | null;
  level: number | null;
}

export default async function LeaderboardPage({
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
  // RLS 限制只能看自己的 sync_scores 一筆。要做匿名排行,需要建 view 或 RPC。
  // Phase 2 simplification:用 RPC public.leaderboard_top() 來繞 RLS。
  // 在還沒上之前,只顯示自己。
  const { data: mineRaw } = await supabase
    .from("sync_scores")
    .select("couple_id, total_score, level")
    .eq("couple_id", couple.id)
    .maybeSingle();
  const mine = mineRaw as ScoreRow | null;

  const myScore = mine?.total_score ?? 0;
  const myLevel = mine?.level ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("leaderboard.title")}</h1>
        <p className="text-xs text-zinc-400">{t("leaderboard.anonymous")}</p>
      </header>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{t("leaderboard.your_rank")}</p>
          <p className="text-2xl font-semibold tabular-nums">
            Lv. {myLevel}
            <span className="text-sm text-zinc-400 ml-2">{myScore}</span>
          </p>
        </div>
        <Badge tone="rose">{t("leaderboard.top_percentile", { n: estimatePercentile(myScore) })}</Badge>
      </Card>

      <Card className="text-sm text-zinc-500">
        Phase 2 開放跨情侶比較。目前只看得到自己的等級,等社群打開後加入排行榜。
      </Card>
    </div>
  );
}

function estimatePercentile(score: number): number {
  // 沒社群基準前的 mock。Phase 2 有 RPC 後抽掉。
  if (score >= 3000) return 1;
  if (score >= 1500) return 5;
  if (score >= 600) return 20;
  if (score >= 100) return 60;
  return 90;
}
