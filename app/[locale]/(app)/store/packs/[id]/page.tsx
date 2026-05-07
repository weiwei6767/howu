import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPremiumUser } from "@/lib/premium/check";
import { getActiveCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PackBuyButton } from "@/components/store/PackBuyButton";

interface Pack {
  id: string;
  name_zh: string;
  name_en: string | null;
  description_zh: string | null;
  type: string | null;
  price_twd: number | null;
  is_premium_included: boolean | null;
}

interface Question {
  id: string;
  text_zh: string;
  text_en: string;
  category: string;
  type: string;
}

export default async function PackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);
  const partnerProfile = await getPartnerProfile(user.id, couple);
  const userPremium = await isPremiumUser(user.id);
  const partnerPremium =
    !!(partnerProfile && partnerProfile.is_premium && (!partnerProfile.premium_expires_at || new Date(partnerProfile.premium_expires_at) > new Date()));
  const isPremiumPair = userPremium || partnerPremium;

  const supabase = await createSupabaseServerClient();
  const { data: packRaw } = await supabase
    .from("question_packs")
    .select("id, name_zh, name_en, description_zh, type, price_twd, is_premium_included")
    .eq("id", id)
    .maybeSingle();
  const pack = packRaw as Pack | null;
  if (!pack) notFound();

  const { data: questionsRaw } = await supabase
    .from("questions")
    .select("id, text_zh, text_en, category, type")
    .eq("pack_id", id)
    .limit(20);
  const questions = (questionsRaw as Question[] | null) ?? [];

  const userIds = couple
    ? [user.id, couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id].filter(
        Boolean,
      ) as string[]
    : [user.id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownedRaw } = await (supabase as any)
    .from("pack_purchases")
    .select("pack_id")
    .eq("pack_id", id)
    .in("user_id", userIds);
  const isOwned = ((ownedRaw as Array<{ pack_id: string }> | null) ?? []).length > 0;

  const isFree = !pack.price_twd || pack.price_twd <= 0;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/store" className="text-sm text-zinc-500">
        ← 商城
      </Link>

      <Card className="bg-gradient-to-br from-rose-50 to-amber-50 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-md bg-white shadow flex items-center justify-center text-3xl">
            {pack.type === "seasonal" ? "🎁" : "📦"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {locale === "en" && pack.name_en ? pack.name_en : pack.name_zh}
              </h1>
              {pack.is_premium_included && <Badge tone="gold">Premium 內含</Badge>}
              {pack.type && <Badge tone="neutral">{pack.type}</Badge>}
            </div>
            <p className="text-sm text-zinc-600 mt-1">{pack.description_zh}</p>
          </div>
        </div>
      </Card>

      {sp.purchased === "1" && (
        <Card className="bg-green-50 border border-green-200 text-sm text-green-800">
          ✅ {locale === "en" ? "Purchase complete. Refreshing soon." : "購買成功!題目會在下次抽題時加入。"}
        </Card>
      )}

      <PackBuyButton
        packId={pack.id}
        isFree={isFree}
        isOwned={isOwned}
        premiumIncluded={!!pack.is_premium_included}
        isPremiumPair={isPremiumPair}
        priceTwd={pack.price_twd ?? 0}
        locale={locale}
      />

      <Card>
        <h2 className="text-base font-semibold mb-3">
          {locale === "en" ? "Sample questions" : "題目預覽"}
        </h2>
        <ul className="flex flex-col gap-2 divide-y divide-zinc-100">
          {questions.map((q) => (
            <li key={q.id} className="pt-2 first:pt-0">
              <p className="text-sm">{locale === "en" ? q.text_en : q.text_zh}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {q.category} · {q.type}
              </p>
            </li>
          ))}
          {questions.length === 0 && (
            <li className="text-sm text-zinc-400">尚未加入題目</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
