"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpcCustom } from "@/lib/supabase/rpc";
import type { TemplateSummary } from "@/lib/today/picker";

interface Props {
  coupleId: string;
  templates: TemplateSummary[];
  streak: number;
}

const TONE_GRADIENTS = [
  "from-rose-100 via-rose-50 to-amber-50",
  "from-amber-100 via-cream-50 to-rose-50",
  "from-violet-100 via-rose-50 to-amber-50",
  "from-rose-100 via-violet-50 to-rose-50",
];

export function TemplatePicker({ coupleId, templates, streak }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pick() {
    if (!selected) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpcCustom(supabase, "pick_template", {
        p_couple_id: coupleId,
        p_template_id: selected,
      });
      if (error) throw new Error(error.message);
      toast("選好了!", { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 pt-2">
        <p className="text-sm text-zinc-500">今天輪你選 ✨</p>
        <h1 className="text-3xl font-bold tracking-tight">挑一份模板</h1>
        {streak > 0 && (
          <div className="flex items-center gap-2">
            <Badge tone="rose">🔥 連續 {streak} 天</Badge>
          </div>
        )}
      </header>

      {templates.length === 0 ? (
        <Card className="text-center flex flex-col gap-3 py-10 bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-100">
          <div className="text-5xl">📝</div>
          <p className="text-sm text-zinc-600">
            還沒有模板,<br />做一份你們專屬的吧
          </p>
          <Link href="/templates/new" className="self-center mt-2">
            <Button size="lg">建立第一份模板</Button>
          </Link>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {templates.map((t, i) => {
              const isSelected = selected === t.id;
              const disabled = t.question_count === 0;
              const grad = TONE_GRADIENTS[i % TONE_GRADIENTS.length];
              return (
                <li key={t.id}>
                  <motion.button
                    type="button"
                    onClick={() => !disabled && setSelected(t.id)}
                    disabled={disabled}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                    className={`w-full text-left rounded-[var(--radius-card)] bg-gradient-to-br ${grad} shadow-[var(--shadow-card)] p-5 flex items-center gap-4 transition-all relative overflow-hidden ${
                      isSelected
                        ? "ring-2 ring-[var(--color-rose)] shadow-[var(--shadow-card-hover)]"
                        : "hover:shadow-[var(--shadow-card-hover)]"
                    } ${disabled ? "opacity-50" : ""}`}
                  >
                    <span className="text-4xl">{t.emoji ?? "📝"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base">{t.name}</div>
                      {t.description && (
                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-[11px] text-zinc-500">
                          {t.question_count > 0 ? `${t.question_count} 題` : "尚無題目"}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-7 h-7 rounded-full bg-[var(--color-rose)] text-white text-sm flex items-center justify-center shrink-0"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ul>

          <Button
            onClick={pick}
            loading={loading}
            disabled={!selected}
            fullWidth
            size="lg"
          >
            {selected ? "就用這份 →" : "選一份才能開始"}
          </Button>

          <Link
            href="/templates"
            className="text-center text-xs text-zinc-400 hover:text-[var(--color-rose)] transition"
          >
            ⚙️ 管理模板
          </Link>
        </>
      )}
    </div>
  );
}
