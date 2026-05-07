import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPremiumUser } from "@/lib/premium/check";
import { getActiveCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Pack {
  id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  type: string | null;
  price_twd: number | null;
  is_premium_included: boolean | null;
  cover_url: string | null;
  slug: string | null;
}

interface Purchase {
  pack_id: string;
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);
  const partnerProfile = await getPartnerProfile(user.id, couple);
  const partnerPremium =
    !!(partnerProfile && partnerProfile.is_premium && (!partnerProfile.premium_expires_at || new Date(partnerProfile.premium_expires_at) > new Date()));
  const userPremium = await isPremiumUser(user.id);
  const isPremiumPair = userPremium || partnerPremium;

  const supabase = await createSupabaseServerClient();
  // is_active / slug 是新欄位,types.ts 還沒重 gen,先 cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packsRaw } = await (supabase as any)
    .from("question_packs")
    .select("id, name_zh, name_en, description_zh, type, price_twd, is_premium_included, cover_url, slug")
    .eq("is_active", true)
    .order("type", { ascending: true });
  const packs = (packsRaw as Pack[] | null) ?? [];

  // 自己跟對方擁有的
  const userIds = couple
    ? [user.id, couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id].filter(
        Boolean,
      ) as string[]
    : [user.id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchaseRaw } = await (supabase as any)
    .from("pack_purchases")
    .select("pack_id")
    .in("user_id", userIds);
  const ownedIds = new Set(((purchaseRaw as Purchase[] | null) ?? []).map((p) => p.pack_id));

  const grouped: Record<string, Pack[]> = {};
  for (const p of packs) {
    const key = p.type ?? "other";
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(p);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("nav.store")}</h1>
        <p className="text-sm text-zinc-500">
          {locale === "en"
            ? "Question packs · custom cards · howu shop"
            : "題包 · 客製卡片 · howu 商城"}
        </p>
      </header>

      <Link
        href="/store/cards"
        className="rounded-[var(--radius-card)] bg-gradient-to-br from-rose-50 to-amber-50 border border-amber-200 px-4 py-4 flex items-center gap-3"
      >
        <span className="text-3xl">💌</span>
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {locale === "en" ? "Custom cards" : "客製卡片"}
          </div>
          <div className="text-xs text-zinc-500">
            {locale === "en" ? "Print your sync, days together, journey" : "把默契值、D-Day、回憶印出來寄回家"}
          </div>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {Object.entries(grouped).map(([type, list]) => (
        <section key={type} className="flex flex-col gap-3">
          <h2 className="text-base font-semibold capitalize">
            {type === "official"
              ? locale === "en"
                ? "Official packs"
                : "官方題包"
              : type === "seasonal"
                ? locale === "en"
                  ? "Seasonal"
                  : "節日限定"
                : type === "creator"
                  ? locale === "en"
                    ? "Creators"
                    : "創作者"
                  : type === "user_custom"
                    ? locale === "en"
                      ? "Custom"
                      : "自製"
                    : type}
          </h2>
          {list.map((p) => {
            const owned = ownedIds.has(p.id);
            const includedInPremium = p.is_premium_included && isPremiumPair;
            const free = !p.price_twd || p.price_twd <= 0;
            return (
              <Link
                key={p.id}
                href={`/store/packs/${p.id}`}
                className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 hover:shadow-md transition"
              >
                <div className="w-14 h-14 rounded-md bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-2xl">
                  {p.type === "seasonal" ? "🎁" : "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {locale === "en" && p.name_en ? p.name_en : p.name_zh}
                    </span>
                    {owned && <Badge tone="green">{locale === "en" ? "Owned" : "已擁有"}</Badge>}
                    {!owned && includedInPremium && <Badge tone="gold">Premium 內含</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{p.description_zh}</p>
                </div>
                <div className="text-right">
                  {owned ? (
                    <span className="text-xs text-zinc-400">→</span>
                  ) : free ? (
                    <span className="text-xs text-green-600 font-medium">
                      {locale === "en" ? "Free" : "免費"}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums">
                      NT${p.price_twd}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}
