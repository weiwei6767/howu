"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["📝", "☀️", "🌿", "💞", "👀", "🎉", "🌙", "✨", "🔥", "🍒"];

interface Props {
  coupleId: string;
  userId: string;
}

export function NewTemplateForm({ coupleId, userId }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast(t("templates.name_required"), { tone: "error" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("templates")
        .insert({
          couple_id: coupleId,
          name: name.trim(),
          description: desc.trim() || null,
          emoji,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      router.push(`/templates/${data.id}`);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]">{t("templates.icon")}</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-md text-xl flex items-center justify-center border transition-colors ${
                emoji === e
                  ? "border-[var(--color-ink)] bg-[var(--color-paper-dim)]"
                  : "border-[var(--color-paper-line)]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]">{t("templates.name")}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("templates.name_placeholder")}
          maxLength={40}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]">
          {t("templates.description")}
        </label>
        <Textarea
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("templates.description_placeholder")}
          maxLength={120}
        />
      </div>
      <Button onClick={create} loading={loading} className="self-start">
        {t("templates.create_and_add")}
      </Button>
    </section>
  );
}
