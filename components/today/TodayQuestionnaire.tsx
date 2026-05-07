"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FixedSection } from "@/components/questionnaire/FixedSection";
import { RotatingSection, type RotatingAnswerValue } from "@/components/questionnaire/RotatingSection";
import { MoodTags } from "@/components/questionnaire/MoodTags";
import { SecretMessage, type DeliveryMode } from "@/components/questionnaire/SecretMessage";
import type { FixedAnswers } from "@/lib/questions/fixed";
import type { RotatingQuestion } from "@/lib/questions/rotating";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coupleId: string;
  userId: string;
  date: string;
  questions: readonly RotatingQuestion[];
  locale: string;
}

export function TodayQuestionnaire({ coupleId, userId, date, questions, locale }: Props) {
  const t = useTranslations();
  const router = useRouter();

  const [fixed, setFixed] = useState<FixedAnswers>({
    happiness: 5,
    energy: 5,
    stress: 5,
    miss_partner: 5,
    us_overall: 5,
  });
  const [rotating, setRotating] = useState<Record<string, RotatingAnswerValue | null>>({});
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [secretMessage, setSecretMessage] = useState("");
  const [secretMode, setSecretMode] = useState<DeliveryMode>("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const rotating_answers = questions.map((q) => ({
        question_id: q.id,
        type: q.type,
        category: q.category,
        value: rotating[q.id] ?? null,
      }));

      let secret_delivery_at: string | null = null;
      if (secretMessage.trim()) {
        if (secretMode === "tomorrow") {
          const t1 = new Date();
          t1.setDate(t1.getDate() + 1);
          t1.setHours(0, 0, 0, 0);
          secret_delivery_at = t1.toISOString();
        } else if (secretMode === "scheduled" && scheduledDate) {
          secret_delivery_at = new Date(scheduledDate + "T00:00:00").toISOString();
        }
      }

      const supabase = createClient();
      const { error } = await supabase.from("daily_responses").insert({
        couple_id: coupleId,
        responder_id: userId,
        date,
        happiness: fixed.happiness,
        energy: fixed.energy,
        stress: fixed.stress,
        miss_partner: fixed.miss_partner,
        us_overall: fixed.us_overall,
        rotating_answers,
        mood_tags: moodTags,
        secret_message: secretMessage.trim() || null,
        secret_delivery_mode: secretMessage.trim() ? secretMode : null,
        secret_delivery_at,
      });

      if (error) {
        toast(error.message, { tone: "error" });
        return;
      }

      // Trigger sync calculation (Edge Function — Phase 2 上線後啟用)
      void supabase.functions
        .invoke("calculate-sync", { body: { couple_id: coupleId, date } })
        .catch(() => {});

      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      <Card className="flex flex-col gap-5">
        <SectionHeader title={t("questionnaire.section_fixed")} />
        <FixedSection values={fixed} onChange={setFixed} />
      </Card>

      {questions.length > 0 && (
        <Card className="flex flex-col gap-5">
          <SectionHeader title={t("questionnaire.section_rotating")} />
          <RotatingSection
            questions={questions}
            values={rotating}
            onChange={(qid, value) => setRotating((prev) => ({ ...prev, [qid]: value }))}
            locale={locale}
          />
        </Card>
      )}

      <Card>
        <MoodTags values={moodTags} onChange={setMoodTags} />
      </Card>

      <Card>
        <SecretMessage
          message={secretMessage}
          mode={secretMode}
          scheduledDate={scheduledDate}
          onChange={({ message, mode, scheduledDate: sd }) => {
            setSecretMessage(message);
            setSecretMode(mode);
            setScheduledDate(sd);
          }}
        />
      </Card>

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {t("questionnaire.submit_finish")}
      </Button>
    </form>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}
