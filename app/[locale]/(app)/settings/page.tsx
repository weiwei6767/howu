import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/queries";
import { getActiveCouple } from "@/lib/supabase/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { CoupleSettings } from "@/components/settings/CoupleSettings";
import { DangerZone } from "@/components/settings/DangerZone";
import { Card } from "@/components/ui/Card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const profile = await getProfile(user.id);
  const couple = await getActiveCouple(user.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <ProfileForm
        profile={{
          display_name: profile?.display_name ?? "",
          birthday: profile?.birthday ?? "",
          locale: profile?.locale ?? "zh-TW",
        }}
      />

      {couple && <CoupleSettings couple={couple} />}

      <Card className="text-sm text-zinc-500">
        <span className="font-medium">{t("settings.notifications")}</span>
        <p className="text-xs mt-1">推播設定 Phase 2 推出。</p>
      </Card>

      <DangerZone hasCouple={!!couple} coupleStatus={couple?.status ?? null} />
    </div>
  );
}
