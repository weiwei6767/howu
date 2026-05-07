"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home", icon: "📝" },
  { href: "/us", labelKey: "nav.us", icon: "💞" },
  { href: "/journal", labelKey: "nav.journal", icon: "📔" },
  { href: "/memories", labelKey: "nav.memories", icon: "📚" },
  { href: "/settings", labelKey: "nav.settings", icon: "⚙️" },
] as const;

export function AppNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-zinc-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <ul className="grid grid-cols-5 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname.replace(/^\/(zh-TW|en)/, "") === "" ||
                pathname.replace(/^\/(zh-TW|en)/, "") === "/"
              : pathname.includes(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
                  active ? "text-[var(--color-rose)]" : "text-zinc-500"
                }`}
              >
                <span aria-hidden className="text-lg">
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
