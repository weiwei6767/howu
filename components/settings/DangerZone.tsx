"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

  return (
    <section className="pt-4">
      <button
        onClick={logout}
        className="w-full text-left py-3 text-sm text-[var(--color-ink)] hover:text-[var(--color-ink-mid)] transition-colors"
      >
        {t("settings.logout")}
      </button>
    </section>
  );
}
