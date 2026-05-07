import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return <h1 className="text-2xl font-semibold">{t("nav.journal")}</h1>;
}
