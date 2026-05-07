import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function TodayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("questionnaire.title")}</h1>
        <p className="text-sm text-zinc-500">{t("brand.tagline")}</p>
      </header>
      <section className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-6">
        <p className="text-zinc-500 text-sm">問卷骨架待 Phase 1 接上。</p>
      </section>
    </div>
  );
}
