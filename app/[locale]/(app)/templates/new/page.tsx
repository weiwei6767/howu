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
    <div className="flex flex-col gap-5">
      <Link href="/templates" className="text-sm text-zinc-500">← 模板</Link>
      <h1 className="text-2xl font-semibold">新模板</h1>
      <NewTemplateForm coupleId={couple.id} userId={user.id} />
    </div>
  );
}
