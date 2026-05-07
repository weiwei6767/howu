import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, getActiveCouple } from "@/lib/supabase/auth";
import { isPremiumUser } from "@/lib/premium/check";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PricingCards } from "@/components/premium/PricingCard";
import { PREMIUM_FEATURES_EN, PREMIUM_FEATURES_ZH } from "@/lib/premium/plans";

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);
  const isPremium = await isPremiumUser(user.id);

  const features = locale === "en" ? PREMIUM_FEATURES_EN : PREMIUM_FEATURES_ZH;

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center flex flex-col gap-2 pt-4">
        <Badge tone="gold" className="self-center">Premium</Badge>
        <h1 className="text-2xl font-semibold">
          {locale === "en" ? "Unlock the full howu" : "解鎖完整 howu 體驗"}
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          {locale === "en"
            ? "Single subscription, both partners share. Cancel anytime."
            : "一人訂閱、雙方共享 · 隨時取消"}
        </p>
      </header>

      {isPremium ? (
        <Card className="text-center bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200">
          <div className="text-3xl mb-1">✨</div>
          <h2 className="font-semibold text-base">
            {locale === "en" ? "You're already Premium" : "你已是 Premium 用戶"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {couple ? (locale === "en" ? "Both of you have access." : "雙方都已享有 Premium 功能。") : null}
          </p>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">
              {locale === "en" ? "What's included" : "Premium 包含"}
            </h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {features.map((f) => (
                <li key={f} className="flex gap-2 items-start">
                  <span className="text-[var(--color-rose)] mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <PricingCards locale={locale} />

          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            {locale === "en"
              ? "Subscription auto-renews. Cancel anytime in Settings → Plan. 7-day grace period after expiry."
              : "訂閱自動續扣。設定 → 訂閱中可隨時取消,過期後仍享 7 天彈性期。"}
          </p>
        </>
      )}
    </div>
  );
}
