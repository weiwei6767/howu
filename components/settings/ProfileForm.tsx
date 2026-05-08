"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
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
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [name, setName] = useState(profile.display_name);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [locale, setLocale] = useState(profile.locale || currentLocale);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast(t("auth.login"), { tone: "error" });
        return;
      }
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

      if (locale !== currentLocale) {
        // 硬切到對應的 locale URL,觸發整頁重新拿 messages
        // pathname 來自 i18n/navigation,已不含 locale 前綴
        const cleanPath = pathname || "/";
        const newUrl = `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
        window.location.href = newUrl;
        return;
      }
      // locale 沒變,單純存資料
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
