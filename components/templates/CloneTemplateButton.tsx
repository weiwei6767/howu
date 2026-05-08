"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

export function CloneTemplateButton({ templateId }: { templateId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function clone() {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("clone_shared_template", {
        p_template_id: templateId,
      });
      if (error) throw new Error(error.message);
      toast(t("template_share.cloned"), { tone: "success" });
      router.push(`/templates/${data}`);
    } catch (e) {
      const msg = (e as Error).message;
      const known: Record<string, string> = {
        not_authenticated: t("template_share.err_not_authenticated"),
        no_couple: t("template_share.err_no_couple"),
        template_not_found: t("template_share.err_not_found"),
      };
      toast(known[msg] ?? msg, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={clone} loading={loading} fullWidth size="lg">
      {t("template_share.add_to_my_templates")}
    </Button>
  );
}
