import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6 text-center">
      <h1 className="text-3xl font-semibold">howu</h1>
      <p className="text-sm text-zinc-500">{t("brand.tagline")}</p>
      <div className="flex flex-col gap-3">
        <button className="h-12 rounded-[var(--radius-cta)] bg-[var(--color-rose)] text-white font-medium">
          {t("auth.with_line")}
        </button>
        <button className="h-12 rounded-[var(--radius-cta)] border border-zinc-200 font-medium">
          {t("auth.with_google")}
        </button>
        <button className="h-12 rounded-[var(--radius-cta)] border border-zinc-200 font-medium">
          {t("auth.with_apple")}
        </button>
      </div>
    </div>
  );
}
