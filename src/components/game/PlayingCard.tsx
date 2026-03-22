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
          "rounded-lg border-2 border-gray-600 shadow-card",
          "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900",
          "flex items-center justify-center",
          sizeClasses[size],
          animateIn && "animate-card-deal",
          className
        )}
        aria-label="Face-down card"
      >
        <span className="text-blue-400/60 text-lg">🂠</span>
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200/20 shadow-card bg-card-white",
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
          isRed ? "text-card-red" : "text-card-black"
        )}
      >
        <span className="font-bold font-mono">{card.rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>

      {/* Center suit (larger) */}
      <div
        className={cn(
          "w-full text-center text-lg leading-none",
          isRed ? "text-card-red" : "text-card-black"
        )}
      >
        {symbol}
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div
        className={cn(
          "flex flex-col items-center leading-none rotate-180 self-end",
          isRed ? "text-card-red" : "text-card-black"
        )}
      >
        <span className="font-bold font-mono">{card.rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </div>
  );
}
