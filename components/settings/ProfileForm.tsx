"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: { display_name: string; birthday: string; locale: string };
}

export function ProfileForm({ profile }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [name, setName] = useState(profile.display_name);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [locale, setLocale] = useState(profile.locale || currentLocale);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim(),
          birthday: birthday || null,
          locale,
        })
        .eq("id", u.user.id);
      if (error) throw new Error(error.message);

      toast(t("settings.save_success"), { tone: "success" });

      // 若語言有改,切 URL 觸發 i18n 重新 render
      if (locale !== currentLocale) {
        startTransition(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace(pathname as any, { locale: locale as "zh-TW" | "en" });
          router.refresh();
        });
      } else {
        router.refresh();
      }
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
        {t("settings.profile")}
      </h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]" htmlFor="display_name">
          {t("settings.display_name")}
        </label>
        <Input id="display_name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]" htmlFor="birthday">
          {t("settings.birthday")}
        </label>
        <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      </div>

      <LocaleSwitcher value={locale} onChange={setLocale} />

      <Button onClick={save} loading={saving} className="self-start">
        {t("common.save")}
      </Button>
    </section>
  );
}
