import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  is_archived: boolean | null;
  created_at: string | null;
  question_count?: number;
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplRaw } = await (supabase as any)
    .from("templates")
    .select("id, name, description, emoji, is_archived, created_at")
    .eq("couple_id", couple.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  const tpls = (tplRaw as TemplateRow[] | null) ?? [];

  // 算每份模板的題目數
  const templateIds = tpls.map((t) => t.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qRaw } = templateIds.length
    ? await (supabase as any)
        .from("template_questions")
        .select("template_id")
        .in("template_id", templateIds)
    : { data: [] };
  const counts = new Map<string, number>();
  for (const r of (qRaw as Array<{ template_id: string }> | null) ?? []) {
    counts.set(r.template_id, (counts.get(r.template_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">問卷模板</h1>
        <Link href="/templates/new">
          <Button size="sm">+ 新模板</Button>
        </Link>
      </header>

      <Card className="text-sm text-zinc-600 leading-relaxed">
        建你們自己的每日問卷。可以做好幾份,輪流填。每份可以有自己的承諾。
      </Card>

      {tpls.length === 0 ? (
        <Card className="text-center text-sm text-zinc-400 py-8">
          還沒有模板,點右上「+ 新模板」開始
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {tpls.map((t) => (
            <li key={t.id}>
              <Link
                href={`/templates/${t.id}`}
                className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 hover:shadow-md transition"
              >
                <span className="text-2xl">{t.emoji ?? "📝"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{t.description}</p>
                </div>
                <Badge tone="neutral">{counts.get(t.id) ?? 0} 題</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
