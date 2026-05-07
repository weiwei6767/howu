"use client";

import { useTranslations } from "next-intl";
import { Textarea, Input } from "@/components/ui/Input";

export type DeliveryMode = "immediate" | "tomorrow" | "scheduled" | "private";

interface Props {
  message: string;
  mode: DeliveryMode;
  scheduledDate: string;
  onChange: (next: { message: string; mode: DeliveryMode; scheduledDate: string }) => void;
}

const MODES: DeliveryMode[] = ["immediate", "tomorrow", "scheduled", "private"];

export function SecretMessage({ message, mode, scheduledDate, onChange }: Props) {
  const t = useTranslations();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="secret">
        {t("questionnaire.secret_message.label")}
      </label>
      <Textarea
        id="secret"
        rows={3}
        placeholder={t("questionnaire.secret_message.placeholder")}
        value={message}
        onChange={(e) => onChange({ message: e.target.value, mode, scheduledDate })}
        className="font-handwritten text-lg"
        style={{ fontFamily: "var(--font-handwritten)" }}
      />

      {message.trim().length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500">{t("questionnaire.secret_message.delivery_mode_label")}</span>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ message, mode: m, scheduledDate })}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  mode === m
                    ? "bg-[var(--color-rose)] border-[var(--color-rose)] text-white"
                    : "border-zinc-200 text-zinc-700"
                }`}
              >
                {t(`questionnaire.secret_message.delivery_mode.${m}`)}
              </button>
            ))}
          </div>
          {mode === "scheduled" && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-xs text-zinc-500">{t("questionnaire.secret_message.scheduled_date")}</span>
              <Input
                type="date"
                min={today}
                value={scheduledDate}
                onChange={(e) => onChange({ message, mode, scheduledDate: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
