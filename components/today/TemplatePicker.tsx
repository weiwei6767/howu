"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
      toast("選好了", { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-2">
      <header className="flex flex-col gap-1">
        <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-[0.18em]">
          Today
        </p>
        <h1 className="font-serif text-3xl">今天輪你選</h1>
        {streak > 0 && (
          <p className="text-xs text-[var(--color-ink-mid)] mt-1">
            已連續寫了 <span className="text-[var(--color-ink)] font-medium">{streak}</span> 天
          </p>
        )}
      </header>

      {templates.length === 0 ? (
        <div className="surface p-8 text-center flex flex-col gap-3">
          <p className="text-sm text-[var(--color-ink-mid)]">
            還沒有自己的模板。
            <br />
            建一份你們專屬的問題吧。
          </p>
          <Link href="/templates/new" className="self-center mt-2">
            <Button>建立第一份模板</Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col">
            {templates.map((t) => {
              const isSelected = selected === t.id;
              const disabled = t.question_count === 0;
              return (
                <li
                  key={t.id}
                  className="border-b border-[var(--color-paper-line)] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => !disabled && setSelected(t.id)}
                    disabled={disabled}
                    className={`w-full text-left flex items-center gap-4 py-4 transition-colors ${
                      disabled ? "opacity-40" : ""
                    }`}
                  >
                    <span className="text-2xl shrink-0 w-10 text-center" aria-hidden>
                      {t.emoji ?? ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-base ${isSelected ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-ink)]"}`}
                      >
                        {t.name}
                      </div>
                      {t.description && (
                        <p className="text-xs text-[var(--color-ink-mid)] mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--color-ink-soft)] mt-1">
                        {t.question_count > 0 ? `${t.question_count} 題` : "尚無題目"}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-xs ${
                        isSelected
                          ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-white"
                          : "border-[var(--color-paper-line)]"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
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
            {selected ? "就用這份" : "選一份才能開始"}
          </Button>

          <Link
            href="/templates"
            className="text-center text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
          >
            管理模板
          </Link>
        </>
      )}
    </div>
  );
}
