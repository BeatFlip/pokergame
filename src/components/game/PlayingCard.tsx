import { cn, isRedSuit, SUIT_SYMBOLS } from "@/lib/utils";
import type { Card } from "@/types";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  animateIn?: boolean;
}

export function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  className,
  animateIn = false,
}: PlayingCardProps) {
  const sizeClasses = {
    sm: "w-8 h-12 text-xs",
    md: "w-12 h-16 text-sm",
    lg: "w-16 h-24 text-base",
  };

  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "rounded-lg border-2 border-zinc-600 shadow-card",
          "bg-gradient-to-br from-zinc-700 to-zinc-800",
          "flex items-center justify-center",
          sizeClasses[size],
          animateIn && "animate-card-deal",
          className
        )}
        aria-label="Face-down card"
      >
        <div className="w-3/4 h-3/4 rounded-sm bg-zinc-900/30 border border-zinc-600/50" />
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-zinc-500 shadow-card bg-white",
        "flex flex-col items-start justify-between p-1",
        "select-none",
        sizeClasses[size],
        animateIn && "animate-card-deal",
        className
      )}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      {/* Top-left rank + suit */}
      <div
        className={cn(
          "flex flex-col items-center leading-none",
          isRed ? "text-red-600" : "text-black"
        )}
      >
        <span className="font-bold font-mono">{card.rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>

      {/* Center suit (larger) */}
      <div
        className={cn(
          "w-full text-center text-lg leading-none",
          isRed ? "text-red-600" : "text-black"
        )}
      >
        {symbol}
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div
        className={cn(
          "flex flex-col items-center leading-none rotate-180 self-end",
          isRed ? "text-red-600" : "text-black"
        )}
      >
        <span className="font-bold font-mono">{card.rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </div>
  );
}
