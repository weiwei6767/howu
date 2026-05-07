import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PhotoUpload } from "@/components/memories/PhotoUpload";
import { PhotoGrid } from "@/components/memories/PhotoGrid";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
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

      {/* 月度 insight 卡片(Phase 2 接 Edge Function) */}
      <Card>
        <p className="text-xs text-zinc-400 mb-1">
          {t("memories.monthly", { ym: new Date().toISOString().slice(0, 7) })}
        </p>
        <p className="text-sm text-zinc-500">即將推出 — 月度自動產生你們的精選與共同心情標籤。</p>
      </Card>

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
