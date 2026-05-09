import { cn } from "@/lib/utils/cn";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  /** 寬度 — Tailwind 寬度 class 或 inline style */
  w?: string;
  /** 高度 — Tailwind class 或 inline style */
  h?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const ROUND: Record<NonNullable<Props["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-[var(--radius-card)]",
  full: "rounded-full",
};

export function Skeleton({
  w,
  h,
  rounded = "md",
  className,
  style,
  ...rest
}: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "skeleton-shimmer bg-[var(--color-paper-dim)]",
        ROUND[rounded],
        className,
      )}
      style={{ width: w, height: h, ...style }}
      {...rest}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          h="0.7rem"
          rounded="sm"
          style={{ width: i === lines - 1 ? "62%" : "100%" }}
        />
      ))}
    </div>
  );
}
