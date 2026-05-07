import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function PairPage({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t("auth.pair_invite_title")}</h1>
      <p className="text-xs text-zinc-400 break-all">token: {token}</p>
      <button className="h-12 rounded-[var(--radius-cta)] bg-[var(--color-rose)] text-white font-medium">
        {t("auth.pair_accept")}
      </button>
    </div>
  );
}
