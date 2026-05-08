import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "plain";
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { className, children, variant = "surface", padded = true, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        variant === "surface" && "surface",
        padded && "p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
