import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { NewTemplateForm } from "@/components/templates/NewTemplateForm";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/templates"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← 模板
      </Link>
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          New Template
        </p>
        <h1 className="font-serif text-3xl mt-1">新模板</h1>
      </header>
      <NewTemplateForm coupleId={couple.id} userId={user.id} />
    </div>
  );
}
