import * as React from "react";
import { cn } from "./utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-60 active:scale-95",
          {
            "bg-brand-burgundy text-white hover:bg-brand-burgundy/90 shadow-md hover:shadow-lg":
              variant === "default",
            "border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white":
              variant === "outline",
            "bg-transparent text-brand-charcoal hover:bg-brand-charcoal/5": variant === "ghost",
            "bg-destructive text-white hover:bg-destructive/90 shadow-sm":
              variant === "destructive",
            "bg-brand-charcoal text-white hover:bg-brand-charcoal/90 shadow-md":
              variant === "secondary",
            "bg-brand-gold text-brand-charcoal hover:bg-brand-gold/90 shadow-md":
              variant === "gold",
          },
          {
            "h-8 px-4 text-xs uppercase tracking-wide": size === "sm",
            "h-11 px-6 text-sm tracking-wide": size === "md",
            "h-12 px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

