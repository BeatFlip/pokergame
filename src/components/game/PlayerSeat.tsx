import { PlayingCard } from "./PlayingCard";
import { TurnTimer } from "./TurnTimer";
import { formatChips, cn } from "@/lib/utils";
import type { Player, PlayerHand, Card } from "@/types";

interface PlayerSeatProps {
  player: Player;
  hand?: PlayerHand;
  holeCards?: Card[];
  isCurrentTurn: boolean;
  isMe: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  gameUpdatedAt?: string;
  turnTimeoutSeconds?: number;
  onTimeout?: () => void;
}

export function PlayerSeat({
  player,
  hand,
  holeCards,
  isCurrentTurn,
  isMe,
  isDealer,
  isSmallBlind,
  isBigBlind,
  gameUpdatedAt,
  turnTimeoutSeconds = 30,
  onTimeout,
}: PlayerSeatProps) {
  const isFolded = hand?.isFolded ?? false;
  const isAllIn = hand?.isAllIn ?? false;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        isFolded && "opacity-40"
      )}
    >
      {/* Cards */}
      <div className="flex gap-1 mb-1">
        {isMe && holeCards && holeCards.length > 0 ? (
          holeCards.map((card, i) => (
            <PlayingCard key={i} card={card} size="sm" animateIn />
          ))
        ) : (
          <>
            <PlayingCard faceDown size="sm" />
            <PlayingCard faceDown size="sm" />
          </>
        )}
      </div>

      {/* Player info bubble */}
      <div
        className={cn(
          "relative rounded-xl px-3 py-2 border transition-all duration-200",
          "min-w-[80px] text-center",
          isCurrentTurn && !isFolded
            ? "border-accent-gold bg-accent-gold/10 shadow-glow"
            : "border-border bg-bg-secondary",
          isMe && "border-accent-blue/50"
        )}
      >
        {/* Dealer / blind badges */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
          {isDealer && (
            <span className="bg-text-primary text-bg-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              D
            </span>
          )}
          {isSmallBlind && (
            <span className="bg-accent-blue text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              S
            </span>
          )}
          {isBigBlind && (
            <span className="bg-accent-gold text-bg-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              B
            </span>
          )}
        </div>

        <p
          className={cn(
            "text-xs font-medium truncate max-w-[72px]",
            isMe ? "text-accent-blue" : "text-text-primary"
          )}
        >
          {player.name}
        </p>
        <p className="text-xs font-mono text-accent-gold">
          {formatChips(player.chipCount)}
        </p>

        {/* Status badges */}
        {isFolded && (
          <span className="text-xs text-text-muted">FOLD</span>
        )}
        {isAllIn && (
          <span className="text-xs text-accent-red font-bold">ALL IN</span>
        )}
        {hand?.currentBet != null && hand.currentBet > 0 && !isFolded && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
            <span className="text-xs font-mono bg-accent-red/80 text-white rounded-full px-2 py-0.5 whitespace-nowrap">
              {formatChips(hand.currentBet)}
            </span>
          </div>
        )}
      </div>

      {/* Turn timer */}
      {isCurrentTurn && !isFolded && gameUpdatedAt && (
        <div className="mt-1">
          <TurnTimer
            updatedAt={gameUpdatedAt}
            timeoutSeconds={turnTimeoutSeconds}
            isMyTurn={isMe}
            onTimeout={onTimeout}
          />
        </div>
      )}
    </div>
  );
}
