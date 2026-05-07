import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { getPromises } from "@/lib/supabase/queries";
import { PromisesList } from "@/components/promises/PromisesList";

export default async function PromisesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const promises = await getPromises(couple.id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("promises.title")}</h1>
        <p className="text-sm text-zinc-500">{t("promises.subtitle")}</p>
      </header>
      <PromisesList coupleId={couple.id} promises={promises} />
    </div>
  );
}
