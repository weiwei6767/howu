"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";

interface Props {
  packId: string;
  isFree: boolean;
  isOwned: boolean;
  premiumIncluded: boolean;
  isPremiumPair: boolean;
  priceTwd: number;
  locale: string;
}

export function PackBuyButton({
  packId,
  isFree,
  isOwned,
  premiumIncluded,
  isPremiumPair,
  priceTwd,
  locale,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isOwned) {
    return (
      <Button variant="secondary" fullWidth size="lg" disabled>
        {locale === "en" ? "Already owned" : "已擁有,選題會自動帶到"}
      </Button>
    );
  }

  if (premiumIncluded && isPremiumPair) {
    return (
      <Button variant="secondary" fullWidth size="lg" disabled>
        {locale === "en" ? "Included in your Premium" : "Premium 內含"}
      </Button>
    );
  }

  async function buy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/packs/${packId}/buy`, { method: "POST" });
      const json = await res.json();
      if (json.ok && json.free) {
        toast(locale === "en" ? "Added to your packs" : "已加入,刷新即可在問卷見到", { tone: "success" });
        router.refresh();
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast(json.message ?? json.error ?? "error", { tone: "info", duration: 5000 });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={buy} loading={loading} fullWidth size="lg">
        {isFree
          ? locale === "en"
            ? "Get for free"
            : "免費取得"
          : locale === "en"
            ? `Buy NT$${priceTwd}`
            : `購買 NT$${priceTwd}`}
      </Button>
      {!isFree && (
        <p className="text-xs text-zinc-400 text-center">
          {locale === "en"
            ? "Or upgrade Premium to unlock all packs"
            : "或升級 Premium 一次解鎖全部題包"}
        </p>
      )}
    </div>
  );
}
