import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { getProfile, getMilestones } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextSpecialDays, daysUntil } from "@/lib/special-days";
import { PolaroidSlideshow } from "@/components/memories/PolaroidSlideshow";

interface PhotoRow {
  id: string;
  url: string; // = storage path
  caption: string | null;
  taken_at: string | null;
  created_at: string | null;
}

export default async function SlideshowPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ occasion?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const [me, partner, milestones] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
    getMilestones(couple.id),
  ]);

  // 決定當前要播的「特殊日子」
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
  const occasion =
    upcoming.find((u) => u.id === sp.occasion) ??
    upcoming[0] ??
    {
      id: "any",
      name: "我們的回憶",
      emoji: "💞",
      date: "",
      origin: "system" as const,
      recurring: true,
    };

  // 拉所有共同照片(用 proxy URL 確保 same-origin)
  const supabase = await createSupabaseServerClient();
  const { data: photoRaw } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at, created_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(60);
  const photos = ((photoRaw as PhotoRow[] | null) ?? [])
    .filter((p) => p.url && !p.url.includes("/bg/"))
    .map((p) => ({
      id: p.id,
      url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
      caption: p.caption,
      taken_at: p.taken_at ?? p.created_at,
    }));

  return (
    <PolaroidSlideshow
      photos={photos}
      occasionName={occasion.name}
      occasionEmoji={occasion.emoji}
      myName={me?.display_name ?? "你"}
      partnerName={partner?.display_name ?? "對方"}
    />
  );
}
