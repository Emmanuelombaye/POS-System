import * as React from "react";
import { cn } from "./utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "success" | "warning";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        {
          "border-red-500/30 bg-red-900/40 text-red-100": variant === "default",
          "border-slate-600 bg-slate-900/60 text-slate-200":
            variant === "outline",
          "border-emerald-500/40 bg-emerald-900/50 text-emerald-100":
            variant === "success",
          "border-amber-400/40 bg-amber-900/60 text-amber-100":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
};

