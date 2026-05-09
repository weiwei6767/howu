import { getTranslations } from "next-intl/server";

export async function PrivacySection() {
  const t = await getTranslations();
  const supportEmail = t("privacy.support_email");

  const blocks: Array<{ title: string; body: string }> = [
    { title: t("privacy.stored_title"), body: t("privacy.stored_items") },
    { title: t("privacy.retention_active_title"), body: t("privacy.retention_active") },
    { title: t("privacy.retention_disconnect_title"), body: t("privacy.retention_disconnect") },
    { title: t("privacy.retention_delete_title"), body: t("privacy.retention_delete") },
  ];

  return (
    <details className="group flex flex-col gap-3 border-y border-[var(--color-paper-line)] py-1">
      <summary className="list-none cursor-pointer flex items-center justify-between py-3 select-none">
        <span className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
          {t("privacy.section_title")}
        </span>
        <span
          className="text-[var(--color-ink-soft)] text-xl leading-none group-open:rotate-45 transition-transform"
          aria-hidden
        >
          +
        </span>
      </summary>

      <div className="flex flex-col gap-4 pb-4">
        <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
          {t("privacy.intro")}
        </p>

        <div className="flex flex-col gap-4">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="border-l-2 border-[var(--color-paper-line)] pl-3 py-0.5"
            >
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
                {b.title}
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-ink)] mt-1">
                {b.body}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-paper-line)] pt-3 mt-2">
          <span className="text-sm text-[var(--color-ink-mid)]">
            {t("privacy.support_title")}
          </span>
          <a
            href={`mailto:${supportEmail}`}
            className="text-sm underline underline-offset-2 hover:text-[var(--color-ink-mid)]"
          >
            {supportEmail}
          </a>
        </div>
      </div>
    </details>
  );
}
