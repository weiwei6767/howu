import { Badge } from "@/components/ui/Badge";

export function PremiumBadge({ size = "sm" }: { size?: "xs" | "sm" }) {
  return (
    <Badge tone="gold" className={size === "xs" ? "text-[10px] px-1.5 py-0" : ""}>
      ✨ Premium
    </Badge>
  );
}
