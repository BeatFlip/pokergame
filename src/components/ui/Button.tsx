import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 touch-target select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed active:scale-95",
          {
            // Variants
            "bg-bg-tertiary text-text-primary border border-border-subtle hover:bg-bg-hover shadow-md":
              variant === "primary",
            "bg-bg-secondary text-text-primary border border-border hover:bg-bg-tertiary":
              variant === "secondary",
            "bg-accent-red text-white border border-red-700 hover:bg-red-700":
              variant === "danger",
            "bg-transparent text-text-primary hover:bg-bg-secondary border border-transparent":
              variant === "ghost",
            "bg-accent-gold text-bg-primary border border-accent-gold-dark hover:brightness-110 font-bold shadow-glow":
              variant === "gold",
            // Sizes
            "text-sm px-3 py-2 min-h-[36px]": size === "sm",
            "text-base px-5 py-3 min-h-[48px]": size === "md",
            "text-lg px-7 py-4 min-h-[56px] text-xl": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
