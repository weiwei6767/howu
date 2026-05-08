"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = window.location.href;
      // 優先 Web Share
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (navigator as any).share({
            title: document.title,
            url,
          });
          return;
        } catch {
          // fallthrough 複製
        }
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("連結已複製", { tone: "success" });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    }
  }

  return (
    <Button onClick={copy} fullWidth size="lg" variant={copied ? "soft" : "primary"}>
      {copied ? "✓ 已複製" : "📤 分享連結"}
    </Button>
  );
}
