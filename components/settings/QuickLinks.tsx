import { Link } from "@/i18n/navigation";

const LINKS = [
  { href: "/store", label: "商城" },
  { href: "/leaderboard", label: "排行" },
] as const;

export function QuickLinks() {
  return (
    <ul className="grid grid-cols-2 gap-px bg-[var(--color-paper-line)] border border-[var(--color-paper-line)] rounded-[var(--radius-card)] overflow-hidden">
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
