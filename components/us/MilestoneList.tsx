"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { differenceInCalendarDays } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import type { Milestone } from "@/lib/supabase/queries";
import { nextMilestone } from "@/lib/utils/date";

const TYPES = ["anniversary", "first_meet", "first_trip", "birthday_a", "birthday_b", "custom"] as const;

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
  const [type, setType] = useState<(typeof TYPES)[number]>("custom");
  const [recurring, setRecurring] = useState(true);
  const [loading, setLoading] = useState(false);

  const upcoming = nextMilestone(milestones);

  async function add() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("milestones").insert({
        couple_id: coupleId,
        title: title.trim(),
        date,
        type,
        recurring,
      });
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      setOpen(false);
      setTitle("");
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

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("us.milestones_title")}</h2>
        <button
          className="text-xs text-[var(--color-rose)] underline"
          onClick={() => setOpen(true)}
        >
          {t("us.add_milestone")}
        </button>
      </div>

      {upcoming && (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-rose-soft)]/30 px-3 py-2">
          <p className="text-xs text-zinc-500">{t("us.next_milestone")}</p>
          <p className="text-sm font-medium mt-0.5">
            {upcoming.title}{" "}
            <span className="text-xs text-[var(--color-rose)]">
              · {daysFromNow(upcoming.date, !!upcoming.recurring)}
            </span>
          </p>
        </div>
      )}

      <ul className="flex flex-col divide-y divide-zinc-100">
        {milestones.length === 0 && (
          <li className="text-sm text-zinc-400 py-3">{t("promises.empty")}</li>
        )}
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2.5">
            <div className="flex flex-col">
              <span className="text-sm">{m.title}</span>
              <span className="text-xs text-zinc-400">
                {m.date} · {t(`us.milestone_type.${m.type ?? "custom"}` as const)}
              </span>
            </div>
            <button
              className="text-xs text-zinc-400 hover:text-red-500"
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
            <Button onClick={add} loading={loading}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input placeholder="例:第一次旅行" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {TYPES.map((tt) => (
              <button
                key={tt}
                type="button"
                onClick={() => setType(tt)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  type === tt
                    ? "border-[var(--color-rose)] text-[var(--color-rose)] bg-[var(--color-rose-soft)]/30"
                    : "border-zinc-200 text-zinc-600"
                }`}
              >
                {t(`us.milestone_type.${tt}`)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            <span>每年提醒(週年/生日)</span>
          </label>
        </div>
      </Modal>
    </Card>
  );
}

function daysFromNow(dateStr: string, recurring: boolean): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (recurring) {
    target.setFullYear(today.getFullYear());
    if (target.getTime() < today.getTime()) target.setFullYear(today.getFullYear() + 1);
  }
  const days = differenceInCalendarDays(target, today);
  if (days === 0) return "今天";
  if (days < 0) return `${Math.abs(days)} 天前`;
  return `${days} 天後`;
}
