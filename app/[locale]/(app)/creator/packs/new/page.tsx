import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { CreatePackForm } from "@/components/creator/CreatePackForm";

export default async function NewPackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">新建題包</h1>
      <CreatePackForm userId={user.id} />
    </div>
  );
}
