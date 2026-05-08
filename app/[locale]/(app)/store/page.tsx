import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("store");

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] self-start"
      >
        {t("back_home")}
      </Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("code_label")}
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("title")}</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2 leading-relaxed">
          {t("intro")}
        </p>
      </header>

      {/* HOWU Crystal Memory — 主打 */}
      <ProductCard
        flagship
        productKey="crystal"
        eyebrow={t("crystal.size")}
        title={t("crystal.name")}
        tagline={t("crystal.tagline")}
        price={t("crystal.price")}
        priceSub={null}
        features={[
          t("crystal.feature_streak"),
          t("crystal.feature_names"),
          t("crystal.feature_anniversary"),
          t("crystal.feature_quote"),
        ]}
        atmosphere={t("crystal.atmosphere")}
        comingSoon={t("coming_soon")}
        remindMe={t("remind_me")}
      />

      {/* HOWU Letter */}
      <ProductCard
        flagship={false}
        productKey="letter"
        eyebrow={null}
        title={t("letter.name")}
        tagline={t("letter.tagline")}
        price={t("letter.price")}
        priceSub={t("letter.express")}
        features={[
          t("letter.feature_write"),
          t("letter.feature_mail"),
          t("letter.feature_style"),
        ]}
        atmosphere={null}
        comingSoon={t("coming_soon")}
        remindMe={t("remind_me")}
      />

      {/* Orders */}
      <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-6">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
          {t("orders_title")}
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)] py-2">
          {t("no_orders")}
        </p>
      </section>
    </div>
  );
}

function ProductCard({
  flagship,
  productKey,
  eyebrow,
  title,
  tagline,
  price,
  priceSub,
  features,
  atmosphere,
  comingSoon,
  remindMe,
}: {
  flagship: boolean;
  productKey: "crystal" | "letter";
  eyebrow: string | null;
  title: string;
  tagline: string;
  price: string;
  priceSub: string | null;
  features: string[];
  atmosphere: string | null;
  comingSoon: string;
  remindMe: string;
}) {
  return (
    <article className="surface overflow-hidden flex flex-col">
      {/* 視覺區 */}
      <div
        className="relative aspect-[5/4] flex items-center justify-center overflow-hidden"
        style={{
          background:
            productKey === "crystal"
              ? "linear-gradient(135deg, #e8eef3 0%, #f4f1ec 50%, #d9dde2 100%)"
              : "linear-gradient(135deg, #f5e8eb 0%, #fbf9f6 50%, #efe8de 100%)",
        }}
      >
        {productKey === "crystal" ? <CrystalVisual /> : <LetterVisual />}
        {flagship && (
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.3em] bg-[var(--color-ink)] text-white px-2 py-1 rounded-sm">
            Flagship
          </span>
        )}
      </div>

      {/* 文字區 */}
      <div className="p-5 flex flex-col gap-4">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
            {eyebrow}
          </p>
        )}
        <header className="flex flex-col gap-1.5">
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
            {tagline}
          </p>
        </header>

        <div className="flex items-baseline gap-2 border-y border-[var(--color-paper-line)] py-3">
          <span className="font-serif text-2xl tabular-nums text-[var(--color-ink)]">
            {price}
          </span>
          {priceSub && (
            <span className="text-xs text-[var(--color-ink-soft)]">
              · {priceSub}
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 text-sm text-[var(--color-ink)] leading-relaxed"
            >
              <span className="text-[var(--color-accent)]">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {atmosphere && (
          <p className="text-xs text-[var(--color-ink-soft)] italic leading-relaxed">
            {atmosphere}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
            {comingSoon}
          </span>
          <button
            disabled
            className="text-xs px-4 py-2 rounded-[var(--radius-button)] bg-[var(--color-paper-dim)] text-[var(--color-ink-mid)] cursor-not-allowed"
          >
            {remindMe}
          </button>
        </div>
      </div>
    </article>
  );
}

function CrystalVisual() {
  return (
    <div className="relative w-32 h-32">
      {/* 水晶塊 */}
      <div
        className="absolute inset-0 rounded-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(220,228,234,0.7) 50%, rgba(255,255,255,0.4) 100%)",
          boxShadow:
            "inset 0 1px 2px rgba(255,255,255,0.8), 0 8px 24px -8px rgba(40,55,75,0.25), 0 1px 3px rgba(40,55,75,0.15)",
        }}
      >
        {/* 內刻字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--color-ink)]/50">
          <p className="text-[7px] uppercase tracking-[0.3em]">In Love For</p>
          <p
            className="text-3xl tabular-nums leading-none mt-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            365
          </p>
          <p className="text-[7px] uppercase tracking-[0.3em] mt-1">Days</p>
          <div className="w-6 h-px bg-[var(--color-ink)]/20 my-1.5" />
          <p className="text-[7px]" style={{ fontFamily: "Georgia, serif" }}>
            A & B
          </p>
        </div>
      </div>
      {/* 高光 */}
      <div
        className="absolute -top-2 -right-2 w-10 h-10 rounded-full opacity-80 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
}

function LetterVisual() {
  return (
    <div className="relative">
      {/* 信封背景 */}
      <div
        className="w-40 h-24 rounded-sm relative"
        style={{
          background: "linear-gradient(180deg, #fbf9f6 0%, #efe8de 100%)",
          boxShadow:
            "0 1px 2px rgba(40,25,30,0.1), 0 8px 24px -10px rgba(40,25,30,0.2)",
        }}
      >
        {/* 信封三角 */}
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.06) 100%)",
            clipPath: "polygon(0 50%, 50% 100%, 100% 50%, 100% 100%, 0 100%)",
          }}
        />
        {/* 蠟封 */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #c2495a 0%, #8a223a 80%)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="absolute inset-0 flex items-center justify-center text-white text-[9px]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            h
          </span>
        </div>
      </div>
      {/* 探出來的小卡 */}
      <div
        className="absolute -top-2 left-2 right-2 h-3 rounded-t-sm"
        style={{
          background: "white",
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}
