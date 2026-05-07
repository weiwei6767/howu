import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Props {
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

export function PlanCard({ isPremium, premiumExpiresAt }: Props) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">訂閱方案</span>
          {isPremium ? <Badge tone="gold">✨ Premium</Badge> : <Badge tone="neutral">免費版</Badge>}
        </div>
        {isPremium && premiumExpiresAt && (
          <p className="text-xs text-zinc-400 mt-1">
            到期 {new Date(premiumExpiresAt).toISOString().slice(0, 10)}
          </p>
        )}
      </div>
      <Link href="/premium" className="text-sm text-[var(--color-rose)] underline">
        {isPremium ? "管理" : "升級"}
      </Link>
    </Card>
  );
}
