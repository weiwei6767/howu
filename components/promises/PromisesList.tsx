"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import type { PromiseRow } from "@/lib/supabase/queries";

interface Props {
  coupleId: string;
  promises: PromiseRow[];
}

export function PromisesList({ coupleId, promises }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("promises").insert({
        couple_id: coupleId,
        text_zh: text.trim(),
        enabled: true,
      });
      if (error) throw new Error(error.message);
      setText("");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    const supabase = createClient();
    await supabase.from("promises").update({ enabled }).eq("id", id);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("promises").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex gap-2">
        <Input
          placeholder={t("promises.placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} loading={loading} disabled={!text.trim()}>
          {t("promises.add")}
        </Button>
      </Card>

      {promises.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 py-6">{t("promises.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {promises.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] px-4 py-3 ${
                p.enabled ? "" : "opacity-50"
              }`}
            >
              <input
                type="checkbox"
                checked={!!p.enabled}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
              <span className={`flex-1 text-sm ${p.enabled ? "" : "line-through"}`}>
                {p.text_zh}
              </span>
              <button
                onClick={() => remove(p.id)}
                className="text-xs text-zinc-400 hover:text-red-500"
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
