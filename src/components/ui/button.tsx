import * as React from "react";
import { cn } from "./utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-60",
          {
            "bg-primary text-primary-foreground hover:bg-red-700":
              variant === "default",
            "border border-slate-700 bg-slate-900 hover:bg-slate-800":
              variant === "outline",
            "bg-transparent hover:bg-slate-900/50": variant === "ghost",
            "bg-destructive text-destructive-foreground hover:bg-red-700":
              variant === "destructive",
            "bg-secondary text-secondary-foreground hover:bg-slate-700":
              variant === "secondary",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-11 px-6 text-base": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

