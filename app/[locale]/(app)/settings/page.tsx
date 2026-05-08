import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/queries";
import { getActiveCouple } from "@/lib/supabase/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { CoupleSettings } from "@/components/settings/CoupleSettings";
import { DangerZone } from "@/components/settings/DangerZone";
import { PushToggle } from "@/components/settings/PushToggle";
import { QuickLinks } from "@/components/settings/QuickLinks";

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
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          Account
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("settings.title")}</h1>
      </header>

      <QuickLinks />

      <ProfileForm
        profile={{
          display_name: profile?.display_name ?? "",
          birthday: profile?.birthday ?? "",
          locale: profile?.locale ?? "zh-TW",
        }}
      />

      {couple && <CoupleSettings couple={couple} />}

      <PushToggle />

      <DangerZone hasCouple={!!couple} coupleStatus={couple?.status ?? null} />
    </div>
  );
}
