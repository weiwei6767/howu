"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
    toast(t("settings.delete_account_email_help"), { tone: "info", duration: 6000 });
  }

  return (
    <section className="flex flex-col gap-1 pt-4 border-t border-[var(--color-paper-line)]">
      <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em] mb-2">
        {t("settings.danger_zone")}
      </h2>
      <button
        onClick={logout}
        className="text-left py-3 text-sm text-[var(--color-ink)] hover:text-[var(--color-ink-mid)] border-b border-[var(--color-paper-line)] transition-colors"
      >
        {t("settings.logout")}
      </button>
      <button
        onClick={deleteAccount}
        className="text-left py-3 text-sm text-[var(--color-danger)] hover:opacity-80 transition-colors"
      >
        {t("settings.delete_account")}
      </button>
    </section>
  );
}
