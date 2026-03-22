"use client";

import { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose?.()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-md bg-surface-DEFAULT border border-surface-overlay",
          "rounded-t-2xl sm:rounded-2xl p-6",
          "animate-slide-up",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <h2 className="text-xl font-display font-semibold text-card-white mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
