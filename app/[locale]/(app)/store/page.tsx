import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("store");

  const features = [
    t("premium_features.unlimited"),
    t("premium_features.deeper_book"),
    t("premium_features.ai_recap"),
    t("premium_features.priority"),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("code_label")}
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("title")}</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2 leading-relaxed">
          {t("intro")}
        </p>
      </header>

      {/* Premium */}
      <section className="surface p-5 flex flex-col gap-3">
        <header>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent-deep)]">
            {t("premium_title")}
          </p>
          <h2 className="font-serif text-2xl mt-1">{t("premium_subtitle")}</h2>
        </header>
        <ul className="flex flex-col gap-2 mt-1">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 text-sm text-[var(--color-ink)]"
            >
              <span className="text-[var(--color-accent)]">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <button
          disabled
          className="self-start mt-3 px-4 py-2 rounded-[var(--radius-button)] bg-[var(--color-paper-dim)] text-[var(--color-ink-mid)] text-sm cursor-not-allowed"
        >
          {t("premium_cta")}
        </button>
        <p className="text-xs text-[var(--color-ink-soft)]">
          {t("premium_coming_soon")}
        </p>
      </section>

      {/* Orders */}
      <section className="flex flex-col gap-3 border-b border-[var(--color-paper-line)] pb-6">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
          {t("orders_title")}
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)] py-2">
          {t("no_orders")}
        </p>
      </section>

      {/* More */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
          {t("more_title")}
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)] py-2">
          {t("more_coming")}
        </p>
      </section>
    </div>
  );
}
