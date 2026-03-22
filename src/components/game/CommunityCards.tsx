import { PlayingCard } from "./PlayingCard";
import type { Card, GamePhase } from "@/types";

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  const slots = 5;

  return (
    <div className="flex items-center gap-2 justify-center" aria-label="Community cards">
      {Array.from({ length: slots }).map((_, i) => {
        const card = cards[i];
        const isRevealed =
          (phase === "flop" && i < 3) ||
          (phase === "turn" && i < 4) ||
          (phase === "river" && i < 5) ||
          phase === "showdown" ||
          phase === "settlement";

        if (card && isRevealed) {
          return (
            <PlayingCard
              key={i}
              card={card}
              size="md"
              animateIn
            />
          );
        }

        // Empty slot placeholder
        return (
          <div
            key={i}
            className="w-12 h-16 rounded-lg border-2 border-dashed border-border-subtle/30"
            aria-hidden
          />
        );
      })}
    </div>
  );
}
