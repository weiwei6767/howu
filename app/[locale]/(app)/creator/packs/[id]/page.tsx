import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PackEditor } from "@/components/creator/PackEditor";

interface Pack {
  id: string;
  name_zh: string;
  description_zh: string | null;
  price_twd: number | null;
  is_active: boolean | null;
  published_at: string | null;
  type: string | null;
}

interface Question {
  id: string;
  text_zh: string;
  text_en: string;
  type: string;
  category: string;
}

export default async function PackEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packRaw } = await (supabase as any)
    .from("question_packs")
    .select("id, name_zh, description_zh, price_twd, is_active, published_at, type, creator_id")
    .eq("id", id)
    .maybeSingle();
  const pack = packRaw as (Pack & { creator_id: string }) | null;
  if (!pack || pack.creator_id !== user.id) notFound();

  const { data: questionsRaw } = await supabase
    .from("questions")
    .select("id, text_zh, text_en, type, category")
    .eq("pack_id", id)
    .order("id");
  const questions = (questionsRaw as Question[] | null) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/creator" className="text-sm text-zinc-500">← 創作者後台</Link>
      <h1 className="text-2xl font-semibold">{pack.name_zh}</h1>
      <PackEditor packId={id} questions={questions} />
    </div>
  );
}
