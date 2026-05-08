"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

const LOCALES = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
] as const;

export function LocaleSwitcher() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  function switchTo(target: string) {
    if (target === current) return;
    startTransition(async () => {
      // 樂觀切 URL,失敗在 DB 部份不擋路
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(pathname as any, { locale: target as "zh-TW" | "en" });
      router.refresh();

      // 同步寫進 profiles.locale,讓下次登入也保留偏好
      try {
        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        const { error } = await supabase
          .from("profiles")
          .update({ locale: target })
          .eq("id", u.user.id);
        if (error) {
          toast(error.message, { tone: "error" });
        }
      } catch (e) {
        toast((e as Error).message, { tone: "error" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-ink-mid)]">
        {t("settings.language_label")}
      </span>
      <div className="flex gap-2">
        {LOCALES.map((l) => {
          const active = current === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => switchTo(l.code)}
              disabled={pending || active}
              className={`flex-1 py-2 text-sm rounded-[var(--radius-button)] border transition-colors disabled:opacity-100 ${
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)] hover:border-[var(--color-ink-mid)]"
              } ${pending && !active ? "opacity-60" : ""}`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
