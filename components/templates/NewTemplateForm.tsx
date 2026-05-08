"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast("先給模板取個名字", { tone: "error" });
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
        <label className="text-xs text-[var(--color-ink-mid)]">圖示</label>
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
        <label className="text-xs text-[var(--color-ink-mid)]">名稱</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例:每日心情快速版"
          maxLength={40}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]">
          描述(選填)
        </label>
        <Textarea
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="什麼時候用這份?寫起來大概多久?"
          maxLength={120}
        />
      </div>
      <Button onClick={create} loading={loading} className="self-start">
        建立並加題
      </Button>
    </section>
  );
}
