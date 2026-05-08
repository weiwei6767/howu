import Link from "next/link";

const LINKS = [
  { href: "/orders", label: "訂單" },
  { href: "/creator", label: "創作者後台" },
  { href: "/friends", label: "朋友" },
  { href: "/leaderboard", label: "排行" },
  { href: "/store", label: "商城" },
  { href: "/premium", label: "Premium" },
] as const;

export function QuickLinks() {
  return (
    <ul className="grid grid-cols-3 gap-px bg-[var(--color-paper-line)] border border-[var(--color-paper-line)] rounded-[var(--radius-card)] overflow-hidden">
      {LINKS.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="flex items-center justify-center px-3 py-3 text-sm bg-white hover:bg-[var(--color-paper-dim)] transition-colors text-[var(--color-ink)]"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
