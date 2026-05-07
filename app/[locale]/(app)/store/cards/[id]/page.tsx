import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireUser, getActiveCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { getProfile, getSyncScore } from "@/lib/supabase/queries";
import { isPremiumUser } from "@/lib/premium/check";
import { ddayCount } from "@/lib/utils/date";
import { getCardProduct } from "@/lib/store/card-products";
import { CardCustomize } from "@/components/store/CardCustomize";

export default async function CardProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const product = getCardProduct(id);
  if (!product) notFound();

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);
  const me = await getProfile(user.id);
  const partnerProfile = await getPartnerProfile(user.id, couple);
  const sync = couple ? await getSyncScore(couple.id) : null;
  const isPremium = await isPremiumUser(user.id);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/store/cards" className="text-sm text-zinc-500">← {locale === "en" ? "Cards" : "客製卡片"}</Link>
      <header>
        <h1 className="text-xl font-semibold">
          {locale === "en" ? product.name_en : product.name_zh}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {locale === "en" ? product.description_en : product.description_zh}
        </p>
      </header>

      <CardCustomize
        product={product}
        defaultNameA={me?.display_name ?? "你"}
        defaultNameB={partnerProfile?.display_name ?? "對方"}
        defaultTogetherSince={couple?.together_since ?? null}
        ddayCount={couple ? ddayCount(couple.together_since) : null}
        syncLevel={sync?.level ?? 1}
        isPremium={isPremium}
        locale={locale}
      />
    </div>
  );
}
