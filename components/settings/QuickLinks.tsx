import Link from "next/link";
import { Card } from "@/components/ui/Card";

const LINKS = [
  { href: "/orders", label: "我的訂單", emoji: "📦" },
  { href: "/creator", label: "創作者後台", emoji: "✨" },
  { href: "/friends", label: "朋友榜", emoji: "💞" },
  { href: "/leaderboard", label: "默契排行榜", emoji: "🏆" },
  { href: "/store", label: "商城", emoji: "🛍️" },
  { href: "/premium", label: "Premium", emoji: "⭐" },
] as const;

export function QuickLinks() {
  return (
    <Card className="grid grid-cols-2 gap-1 p-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-zinc-50 text-sm"
        >
          <span className="text-lg">{l.emoji}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </Card>
  );
}
