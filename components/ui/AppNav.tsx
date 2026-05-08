"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" strokeLinejoin="round" />
    </svg>
  );
}
function IconUs({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
      <circle cx="8" cy="9" r="3.2" />
      <circle cx="16" cy="9" r="3.2" />
      <path d="M3 20c.6-3 3-5 5-5s4 2 4 5M13 20c.6-3 3-5 5-5s4 2 4 5" strokeLinecap="round" />
    </svg>
  );
}
function IconJournal({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}
function IconMemories({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.7-6.7l-1.4 1.4M7.7 16.3l-1.4 1.4m0-12.4l1.4 1.4m8.6 8.6l1.4 1.4" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home", Icon: IconHome },
  { href: "/us", labelKey: "nav.us", Icon: IconUs },
  { href: "/journal", labelKey: "nav.journal", Icon: IconJournal },
  { href: "/memories", labelKey: "nav.memories", Icon: IconMemories },
  { href: "/settings", labelKey: "nav.settings", Icon: IconSettings },
] as const;

function stripLocale(p: string) {
  return p.replace(/^\/(zh-TW|en)/, "") || "/";
}

export function AppNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const stripped = stripLocale(pathname);

  return (
    <>
      <InstallPrompt />
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--color-paper-line)] bg-[var(--color-paper)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-paper)]/80">
        <ul className="grid grid-cols-5 max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
            const active =
              href === "/" ? stripped === "/" : stripped.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${
                    active
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-soft)]"
                  }`}
                >
                  <Icon active={active} />
                  <span>{t(labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
