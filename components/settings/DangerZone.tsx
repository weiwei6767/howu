"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  hasCouple: boolean;
  coupleStatus: string | null;
}

export function DangerZone({}: Props) {
  const t = useTranslations();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function deleteAccount() {
    toast("請寄信到 contact@howu.online 我們會在 72h 內處理", { tone: "info", duration: 6000 });
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-700">{t("settings.danger_zone")}</h2>
      <Button variant="ghost" onClick={logout} fullWidth>
        {t("settings.logout")}
      </Button>
      <Button variant="ghost" onClick={deleteAccount} fullWidth className="text-red-500">
        {t("settings.delete_account")}
      </Button>
    </Card>
  );
}
