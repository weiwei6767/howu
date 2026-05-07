import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { CARD_PRODUCTS } from "@/lib/store/card-products";

export default async function CardStorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/store" className="text-sm text-zinc-500">← 商城</Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{locale === "en" ? "Custom cards" : "客製卡片"}</h1>
        <p className="text-sm text-zinc-500">
          {locale === "en"
            ? "Print your sync, days, milestones — ship to home."
            : "把默契值、在一起天數、紀念日印成實體寄回家"}
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {CARD_PRODUCTS.map((p) => (
          <li key={p.id}>
            <Link
              href={`/store/cards/${p.id}`}
              className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 hover:shadow-md transition"
            >
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {locale === "en" ? p.name_en : p.name_zh}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                  {locale === "en" ? p.description_en : p.description_zh}
                </p>
              </div>
              <div className="text-sm font-semibold tabular-nums whitespace-nowrap">
                NT${p.base_price_twd}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs text-zinc-400 text-center mt-2">
        {locale === "en"
          ? "Premium members get 10% off, free shipping on birthdays."
          : "Premium 用戶 9 折,雙方生日當月免運。"}
      </p>
    </div>
  );
}
