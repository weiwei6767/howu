"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BookControls() {
  const router = useRouter();
  return (
    <div className="no-print flex justify-between items-center gap-3">
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-500"
      >
        ← 返回
      </button>
      <Button onClick={() => window.print()} size="sm">
        🖨️ 列印 / 存成 PDF
      </Button>
    </div>
  );
}
