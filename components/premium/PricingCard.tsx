"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { PLANS, type PlanId } from "@/lib/premium/plans";

interface Props {
  locale: string;
}

type Provider = "stripe" | "line-pay" | "jkopay";

export function PricingCards({ locale }: Props) {
  const t = useTranslations();
  const [loading, setLoading] = useState<{ plan: PlanId; provider: Provider } | null>(null);

  async function checkout(plan: PlanId, provider: Provider) {
    setLoading({ plan, provider });
    try {
      const res = await fetch(`/api/checkout/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      const msg = json.message ?? json.error ?? "unknown_error";
      toast(msg, { tone: "info", duration: 5000 });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {PLANS.map((p) => (
        <Card key={p.id} className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">
              {locale === "en" ? p.name_en : p.name_zh}
            </h3>
            {p.saving_label_zh && (
              <Badge tone="rose">
                {locale === "en" ? p.saving_label_en : p.saving_label_zh}
              </Badge>
            )}
          </header>
          <div>
            <span className="text-4xl font-semibold tabular-nums">NT${p.price_twd}</span>
            <span className="text-sm text-zinc-400 ml-1">
              / {p.id === "yearly" ? (locale === "en" ? "year" : "年") : (locale === "en" ? "mo" : "月")}
            </span>
            {p.id === "yearly" && (
              <p className="text-xs text-zinc-500 mt-1">
                {locale === "en" ? `~$${p.per_month_twd}/mo` : `平均 $${p.per_month_twd}/月`}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => checkout(p.id, "stripe")}
              loading={loading?.plan === p.id && loading?.provider === "stripe"}
              fullWidth
            >
              {locale === "en" ? "Card (Stripe)" : "信用卡 (Stripe)"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => checkout(p.id, "line-pay")}
              loading={loading?.plan === p.id && loading?.provider === "line-pay"}
              fullWidth
            >
              LINE Pay
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => checkout(p.id, "jkopay")}
              loading={loading?.plan === p.id && loading?.provider === "jkopay"}
              fullWidth
            >
              {locale === "en" ? "JKO Pay" : "街口支付"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
