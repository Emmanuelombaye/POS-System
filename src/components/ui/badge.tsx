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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-brand-burgundy text-white hover:bg-brand-burgundy/80": variant === "default",
          "text-brand-charcoal border-gray-300":
            variant === "outline",
          "border-transparent bg-emerald-100/80 text-emerald-800":
            variant === "success",
          "border-transparent bg-amber-100/80 text-amber-800":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
};

