"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
      toast(t("settings.save_success"), { tone: "success" });
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
          {t("common.today")}
        </p>
        <h1 className="font-serif text-3xl">{t("today_screen.your_turn_today")}</h1>
        {streak > 0 && (
          <p className="text-xs text-[var(--color-ink-mid)] mt-1">
            {t("today_screen.streak_count", { n: streak })}
          </p>
        )}
      </header>

      {templates.length === 0 ? (
        <div className="surface p-8 text-center flex flex-col gap-3">
          <p className="text-sm text-[var(--color-ink-mid)] whitespace-pre-line">
            {t("templates.no_templates_create_one")}
          </p>
          <Link href="/templates/new" className="self-center mt-2">
            <Button>{t("templates.create_first")}</Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col">
            {templates.map((tpl) => {
              const isSelected = selected === tpl.id;
              const disabled = tpl.question_count === 0;
              return (
                <li
                  key={tpl.id}
                  className="border-b border-[var(--color-paper-line)] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => !disabled && setSelected(tpl.id)}
                    disabled={disabled}
                    className={`w-full text-left flex items-center gap-4 py-4 transition-colors ${
                      disabled ? "opacity-40" : ""
                    }`}
                  >
                    <span className="text-2xl shrink-0 w-10 text-center" aria-hidden>
                      {tpl.emoji ?? ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-base ${isSelected ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-ink)]"}`}
                      >
                        {tpl.name}
                      </div>
                      {tpl.description && (
                        <p className="text-xs text-[var(--color-ink-mid)] mt-0.5 line-clamp-1">
                          {tpl.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--color-ink-soft)] mt-1">
                        {tpl.question_count > 0
                          ? t("templates.n_questions", { n: tpl.question_count })
                          : t("templates.no_questions")}
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
            {selected ? t("templates.use_this") : t("templates.select_to_start")}
          </Button>

          <Link
            href="/templates"
            className="text-center text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
          >
            {t("today_screen.manage_templates")}
          </Link>
        </>
      )}
    </div>
  );
}
