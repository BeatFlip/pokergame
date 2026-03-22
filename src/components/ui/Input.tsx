import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-gray-400 select-none font-mono">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full bg-surface-elevated border border-surface-overlay rounded-xl",
              "text-card-white placeholder:text-gray-500",
              "py-3 px-4 text-base",
              "focus:outline-none focus:ring-2 focus:ring-chip-gold focus:border-transparent",
              "transition-all duration-150",
              "min-h-[48px]",
              prefix && "pl-10",
              error && "border-card-red focus:ring-card-red",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-card-red" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
