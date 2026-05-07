"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** 在 client 監聽 auth state,登入/登出時 refresh server components */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}
