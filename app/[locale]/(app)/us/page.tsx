import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function UsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return <h1 className="text-2xl font-semibold">{t("nav.us")}</h1>;
}
