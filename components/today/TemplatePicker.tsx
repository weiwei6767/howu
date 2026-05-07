"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">今天輪你選</h1>
          {streak > 0 && <Badge tone="rose">🔥 {streak} 天</Badge>}
        </div>
        <p className="text-sm text-zinc-500">挑一份今天兩人一起填</p>
      </header>

      {templates.length === 0 ? (
        <Card className="text-center flex flex-col gap-3 py-8">
          <div className="text-4xl">📝</div>
          <p className="text-sm text-zinc-500">還沒有模板。先建立一份再選。</p>
          <Link href="/templates/new" className="self-center">
            <Button>建立第一份模板</Button>
          </Link>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {templates.map((t) => {
              const isSelected = selected === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.id)}
                    disabled={t.question_count === 0}
                    className={`w-full text-left rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 transition ${
                      isSelected
                        ? "ring-2 ring-[var(--color-rose)]"
                        : "hover:shadow-md"
                    } ${t.question_count === 0 ? "opacity-50" : ""}`}
                  >
                    <span className="text-2xl">{t.emoji ?? "📝"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{t.name}</div>
                      {t.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <Badge tone="neutral">
                      {t.question_count > 0 ? `${t.question_count} 題` : "尚無題目"}
                    </Badge>
                  </button>
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
            就用這份開始
          </Button>

          <Link href="/templates" className="text-center text-xs text-zinc-400 underline">
            管理模板
          </Link>
        </>
      )}
    </div>
  );
}
