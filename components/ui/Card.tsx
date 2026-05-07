import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-6 dark:bg-zinc-900",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
