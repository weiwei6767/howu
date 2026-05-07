"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: { display_name: string; birthday: string; locale: string };
}

export function ProfileForm({ profile }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(profile.display_name);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [locale, setLocale] = useState(profile.locale);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), birthday: birthday || null, locale })
        .eq("id", u.user.id);
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{t("settings.profile")}</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm" htmlFor="display_name">
          {t("settings.display_name")}
        </label>
        <Input id="display_name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm" htmlFor="birthday">
          {t("settings.birthday")}
        </label>
        <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">{t("settings.language")}</span>
        <div className="flex gap-2">
          {["zh-TW", "en"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`flex-1 py-2 text-sm rounded-[var(--radius-button)] border ${
                locale === l
                  ? "border-[var(--color-rose)] bg-[var(--color-rose-soft)]/40 text-[var(--color-rose)]"
                  : "border-zinc-200 text-zinc-600"
              }`}
            >
              {l === "zh-TW" ? "繁體中文" : "English"}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving}>
        {t("common.save")}
      </Button>
    </Card>
  );
}
