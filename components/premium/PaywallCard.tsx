"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumBadge } from "./PremiumBadge";

interface Props {
  title?: string;
  body?: string;
}

export function PaywallCard({ title, body }: Props) {
  const t = useTranslations();
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 flex flex-col gap-3 text-center">
      <PremiumBadge />
      <h3 className="text-base font-semibold">
        {title ?? "這個功能屬於 Premium"}
      </h3>
      {body && <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>}
      <Link href="/premium" className="w-full">
        <Button fullWidth>升級 Premium</Button>
      </Link>
    </Card>
  );
}
