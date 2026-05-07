"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { ddayCount } from "@/lib/utils/date";

interface Props {
  togetherSince: string;
  partnerName: string | null;
  myName: string | null;
}

export function DDayCard({ togetherSince, partnerName, myName }: Props) {
  const t = useTranslations();
  const days = ddayCount(togetherSince);

  return (
    <Card className="text-center bg-gradient-to-br from-[var(--color-rose-soft)]/40 to-white py-8">
      <p className="text-sm text-zinc-500 mb-1">{t("us.dday")}</p>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-5xl font-semibold tabular-nums text-[var(--color-rose)]"
      >
        {days}
      </motion.div>
      <p className="text-sm text-zinc-500 mt-1">{t("us.days", { n: "" })}</p>
      {(myName || partnerName) && (
        <p className="text-sm text-zinc-700 mt-3">
          {myName ?? "我"} <span className="text-[var(--color-rose)]">&</span>{" "}
          {partnerName ?? "對方"}
        </p>
      )}
      <p className="text-xs text-zinc-400 mt-1">{togetherSince}</p>
    </Card>
  );
}
