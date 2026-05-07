import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function PremiumSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col items-center gap-5 pt-12 text-center">
      <div className="text-6xl">✨</div>
      <h1 className="text-2xl font-semibold">
        {locale === "en" ? "Welcome to Premium" : "升級成功 · 歡迎加入 Premium"}
      </h1>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
        {locale === "en"
          ? "Your subscription is active. New questions, themes, and AI features are unlocked. Both you and your partner now have access."
          : "訂閱已啟用 · 進階題庫、樹皮膚、AI 模板都可以使用了。對方也會立刻擁有 Premium 權限。"}
      </p>
      <Link href="/" className="w-full max-w-xs">
        <Button fullWidth size="lg">
          {locale === "en" ? "Back to today's check-in" : "回到今日問卷"}
        </Button>
      </Link>
    </div>
  );
}
