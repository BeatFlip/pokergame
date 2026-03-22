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
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-chip-gold focus-visible:ring-offset-2 focus-visible:ring-offset-felt-dark",
          "disabled:opacity-40 disabled:cursor-not-allowed active:scale-95",
          {
            // Variants
            "bg-felt-green text-card-white border border-felt-light hover:bg-felt-light active:bg-felt-edge shadow-md":
              variant === "primary",
            "bg-surface-elevated text-card-white border border-surface-overlay hover:bg-surface-overlay":
              variant === "secondary",
            "bg-card-red text-white border border-red-700 hover:bg-red-700":
              variant === "danger",
            "bg-transparent text-card-white hover:bg-surface-elevated border border-transparent":
              variant === "ghost",
            "bg-chip-gold text-felt-dark border border-yellow-500 hover:brightness-110 font-bold shadow-glow":
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
