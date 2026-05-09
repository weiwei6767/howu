"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import type { Milestone } from "@/lib/supabase/queries";
import { nextMilestone } from "@/lib/utils/date";

const PRESET_TYPES = [
  "anniversary",
  "first_meet",
  "first_trip",
  "birthday_a",
  "birthday_b",
] as const;

type PresetType = (typeof PRESET_TYPES)[number];

interface Props {
  coupleId: string;
  milestones: Milestone[];
}

export function MilestoneList({ coupleId, milestones }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [presetType, setPresetType] = useState<PresetType | null>("anniversary");
  const [customType, setCustomType] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [loading, setLoading] = useState(false);

  const upcoming = nextMilestone(milestones);

  function reset() {
    setTitle("");
    setDate(new Date().toISOString().slice(0, 10));
    setPresetType("anniversary");
    setCustomType("");
    setRecurring(true);
  }

  async function add() {
    if (!title.trim()) return;
    const finalType = customType.trim() ? customType.trim() : presetType ?? "custom";
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("milestones").insert({
        couple_id: coupleId,
        title: title.trim(),
        date,
        type: finalType,
        recurring,
      });
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) {
      toast(error.message, { tone: "error" });
      return;
    }
    router.refresh();
  }

  function daysFromNow(dateStr: string, isRecurring: boolean): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    if (isRecurring) {
      target.setFullYear(today.getFullYear());
      if (target.getTime() < today.getTime()) target.setFullYear(today.getFullYear() + 1);
    }
    const days = differenceInCalendarDays(target, today);
    if (days === 0) return t("us.milestone_today");
    if (days < 0) return t("us.milestone_n_days_ago", { n: Math.abs(days) });
    return t("us.milestone_n_days_after", { n: days });
  }

  function typeLabel(type: string | null): string {
    if (!type) return t("us.milestone_type.custom");
    if ((PRESET_TYPES as readonly string[]).includes(type) || type === "custom") {
      return t(`us.milestone_type.${type}` as const);
    }
    return type;
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm text-[var(--color-ink-mid)]">{t("us.milestones_title")}</h2>
        <button
          className="text-xs text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-ink-mid)]"
          onClick={() => setOpen(true)}
        >
          {t("us.add_milestone")}
        </button>
      </header>

      {upcoming && (
        <div className="flex items-baseline justify-between border-l-2 border-[var(--color-accent)] pl-3 py-1">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {t("us.next_milestone")}
            </p>
            <p className="text-sm mt-0.5">{upcoming.title}</p>
          </div>
          <span className="text-xs text-[var(--color-ink-mid)] tabular-nums">
            {daysFromNow(upcoming.date, !!upcoming.recurring)}
          </span>
        </div>
      )}

      <ul className="flex flex-col">
        {milestones.length === 0 && (
          <li className="text-sm text-[var(--color-ink-soft)] py-3">
            {t("promises.empty")}
          </li>
        )}
        {milestones.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between py-3 border-b border-[var(--color-paper-line)] last:border-b-0"
          >
            <div className="flex flex-col">
              <span className="text-sm">{m.title}</span>
              <span className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                {m.date} · {typeLabel(m.type)}
              </span>
            </div>
            <button
              className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
              onClick={() => remove(m.id)}
            >
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("us.add_milestone")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={add} loading={loading} disabled={!title.trim()}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--color-ink-mid)]">名稱</label>
            <Input
              placeholder={t("us.milestone_placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--color-ink-mid)]">日期</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="!py-3 !text-base !min-h-[44px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-[var(--color-ink-mid)]">類型</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TYPES.map((tt) => {
                const active = presetType === tt && !customType.trim();
                return (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => {
                      setPresetType(tt);
                      setCustomType("");
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      active
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                        : "border-[var(--color-paper-line)] text-[var(--color-ink-mid)] hover:border-[var(--color-ink-mid)]"
                    }`}
                  >
                    {t(`us.milestone_type.${tt}`)}
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="或自訂類型(例:認識週年)"
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                if (e.target.value.trim()) setPresetType(null);
              }}
              maxLength={20}
              className="mt-1"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span>{t("us.milestone_year_reminder")}</span>
          </label>
        </div>
      </Modal>
    </section>
  );
}
