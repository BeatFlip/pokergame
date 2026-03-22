import type { Card, GamePhase } from "@/types";
import { createDeck, shuffleDeck, drawCards, generateDeckSeed } from "./deck";
import { isBettingRoundComplete } from "./betting";
import { determineWinners, bestHandFrom7 } from "./evaluator";

export interface DealResult {
  playerHands: Array<{ playerId: number; cards: Card[] }>;
  deckRemaining: Card[];
  deckSeed: string;
  smallBlindPlayerId: number;
  bigBlindPlayerId: number;
  firstToActId: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
}

/**
 * Get the seat positions in clockwise order starting after the given position.
 */
export function getSeatedOrder(
  players: Array<{ id: number; seatPosition: number }>,
  startAfterPosition: number
): number[] {
  const sorted = [...players].sort((a, b) => a.seatPosition - b.seatPosition);
  const startIdx = sorted.findIndex((p) => p.seatPosition > startAfterPosition);
  const pivot = startIdx === -1 ? 0 : startIdx;
  return [...sorted.slice(pivot), ...sorted.slice(0, pivot)].map((p) => p.id);
}

/**
 * Set up a new hand: shuffle deck, deal 2 cards per player, post blinds.
 * Returns everything needed to update the DB.
 */
export function dealHand(
  players: Array<{ id: number; seatPosition: number; chipCount: number }>,
  dealerPosition: number,
  smallBlind: number,
  bigBlind: number
): DealResult {
  const seed = generateDeckSeed();
  const deck = shuffleDeck(createDeck(), seed);

  const order = getSeatedOrder(
    players.map((p) => ({ id: p.id, seatPosition: p.seatPosition })),
    dealerPosition
  );

  // SB = first after dealer, BB = second after dealer, UTG = third
  const sbId = order[0];
  const bbId = order[1];
  const firstToActId = order[2] ?? order[0]; // heads-up: dealer is SB/first to act

  let deckRemaining = deck;
  const playerHands: Array<{ playerId: number; cards: Card[] }> = [];

  for (const playerId of order) {
    const [cards, remaining] = drawCards(deckRemaining, 2);
    playerHands.push({ playerId, cards });
    deckRemaining = remaining;
  }

  return {
    playerHands,
    deckRemaining,
    deckSeed: seed,
    smallBlindPlayerId: sbId,
    bigBlindPlayerId: bbId,
    firstToActId,
    smallBlindAmount: smallBlind,
    bigBlindAmount: bigBlind,
  };
}

/** Deal community cards for each phase */
export function dealCommunityCards(
  deckRemaining: Card[],
  phase: "flop" | "turn" | "river"
): { cards: Card[]; newDeck: Card[] } {
  const count = phase === "flop" ? 3 : 1;
  // Burn one card, then deal
  const [burned, afterBurn] = drawCards(deckRemaining, 1);
  void burned;
  const [cards, newDeck] = drawCards(afterBurn, count);
  return { cards, newDeck };
}

export type PhaseTransition =
  | { nextPhase: "pre_flop" }
  | { nextPhase: "flop"; communityCards: Card[]; deckRemaining: Card[] }
  | { nextPhase: "turn"; communityCards: Card[]; deckRemaining: Card[] }
  | { nextPhase: "river"; communityCards: Card[]; deckRemaining: Card[] }
  | { nextPhase: "showdown" }
  | { nextPhase: "waiting_for_players" };

/**
 * Determine what phase comes next after a betting action.
 * Returns null if the round isn't complete yet.
 */
export function getNextPhase(
  currentPhase: GamePhase,
  playerHands: Array<{
    playerId: number;
    isFolded: boolean;
    isAllIn: boolean;
    currentBet: number;
    actionTaken: string | null;
  }>,
  lastAggressorId: number | null,
  deckRemaining: Card[],
  existingCommunityCards: Card[]
): PhaseTransition | null {
  const activePlayers = playerHands.filter((p) => !p.isFolded);

  // Only one player left — skip to showdown
  if (activePlayers.length === 1) {
    return { nextPhase: "showdown" };
  }

  const roundComplete = isBettingRoundComplete(playerHands, lastAggressorId);
  if (!roundComplete) return null;

  switch (currentPhase) {
    case "pre_flop": {
      const { cards, newDeck } = dealCommunityCards(deckRemaining, "flop");
      return {
        nextPhase: "flop",
        communityCards: [...existingCommunityCards, ...cards],
        deckRemaining: newDeck,
      };
    }
    case "flop": {
      const { cards, newDeck } = dealCommunityCards(deckRemaining, "turn");
      return {
        nextPhase: "turn",
        communityCards: [...existingCommunityCards, ...cards],
        deckRemaining: newDeck,
      };
    }
    case "turn": {
      const { cards, newDeck } = dealCommunityCards(deckRemaining, "river");
      return {
        nextPhase: "river",
        communityCards: [...existingCommunityCards, ...cards],
        deckRemaining: newDeck,
      };
    }
    case "river": {
      return { nextPhase: "showdown" };
    }
    default:
      return null;
  }
}

export interface ShowdownResult {
  winners: Array<{ playerId: number; amountWon: number }>;
  updatedChips: Map<number, number>;
}

/**
 * Evaluate showdown: determine winners, award chips.
 * Handles main pot and side pots for all-in scenarios.
 */
export function resolveShowdown(
  players: Array<{ id: number; chipCount: number }>,
  playerHands: Array<{
    playerId: number;
    holeCards: Card[];
    isFolded: boolean;
    isAllIn: boolean;
    totalInvested: number;
  }>,
  communityCards: Card[],
  potTotal: number
): ShowdownResult {
  const activePlayers = playerHands.filter((p) => !p.isFolded);

  if (activePlayers.length === 0) {
    return { winners: [], updatedChips: new Map() };
  }

  // Single player wins everything (others all folded)
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    const updatedChips = new Map(players.map((p) => [p.id, p.chipCount]));
    updatedChips.set(
      winner.playerId,
      (updatedChips.get(winner.playerId) ?? 0) + potTotal
    );
    return {
      winners: [{ playerId: winner.playerId, amountWon: potTotal }],
      updatedChips,
    };
  }

  // Evaluate all active hands
  const evaluated = activePlayers.map((ph) => ({
    playerId: ph.playerId,
    hand: bestHandFrom7([
      ...ph.holeCards,
      ...communityCards,
    ]),
    totalInvested: ph.totalInvested,
  }));

  const updatedChips = new Map(players.map((p) => [p.id, p.chipCount]));
  const winnings = new Map<number, number>();

  // Simple case: no all-ins, just split pot among winners
  const hasAllIns = playerHands.some((p) => p.isAllIn);

  if (!hasAllIns) {
    const winners = determineWinners(
      activePlayers.map((p) => ({ playerId: p.playerId, holeCards: p.holeCards })),
      communityCards
    );
    const share = Math.floor(potTotal / winners.length);
    const remainder = potTotal - share * winners.length;
    winners.forEach((w, i) => {
      const amount = share + (i === 0 ? remainder : 0);
      winnings.set(w.playerId, (winnings.get(w.playerId) ?? 0) + amount);
    });
  } else {
    // Side pot resolution: sort by total invested, build side pots
    const sortedByInvestment = [...evaluated].sort(
      (a, b) => a.totalInvested - b.totalInvested
    );
    let remaining = potTotal;
    let previousLevel = 0;

    for (const contestant of sortedByInvestment) {
      const level = contestant.totalInvested;
      if (level <= previousLevel) continue;

      const potContributed = Math.min(
        remaining,
        (level - previousLevel) * playerHands.length
      );

      const eligible = evaluated.filter(
        (p) => p.totalInvested >= level
      );
      const sideWinners = determineWinners(
        eligible.map((p) => ({ playerId: p.playerId, holeCards: activePlayers.find(a => a.playerId === p.playerId)!.holeCards })),
        communityCards
      );

      const share = Math.floor(potContributed / sideWinners.length);
      const rem = potContributed - share * sideWinners.length;
      sideWinners.forEach((w, i) => {
        const amount = share + (i === 0 ? rem : 0);
        winnings.set(w.playerId, (winnings.get(w.playerId) ?? 0) + amount);
      });

      remaining -= potContributed;
      previousLevel = level;
      if (remaining <= 0) break;
    }
  }

  // Apply winnings to chip counts
  for (const [playerId, amount] of winnings) {
    updatedChips.set(playerId, (updatedChips.get(playerId) ?? 0) + amount);
  }

  return {
    winners: [...winnings.entries()].map(([playerId, amountWon]) => ({
      playerId,
      amountWon,
    })),
    updatedChips,
  };
}
