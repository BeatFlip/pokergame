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
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-text-muted select-none font-mono">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full bg-bg-secondary border border-border rounded-xl",
              "text-text-primary placeholder:text-text-muted",
              "py-3 px-4 text-base",
              "focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent",
              "transition-all duration-150",
              "min-h-[48px]",
              prefix && "pl-10",
              error && "border-accent-red focus:ring-accent-red",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-accent-red" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
