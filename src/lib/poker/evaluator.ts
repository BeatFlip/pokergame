import {
  EvaluatedHand,
  HandRank,
  HAND_RANK_NAMES,
  Card,
} from "@/types";

/** Generate all C(n, k) combinations of an array */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

/** Count occurrences of each value */
function valueCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const c of cards) {
    counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
  }
  return counts;
}

function isFlush(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): { is: boolean; highValue: number } {
  const values = [...new Set(cards.map((c) => c.value))].sort((a, b) => b - a);
  if (values.length < 5) return { is: false, highValue: 0 };

  // Normal straight
  if (values[0] - values[4] === 4) {
    return { is: true, highValue: values[0] };
  }
  // Wheel: A-2-3-4-5 (Ace acts as 1)
  if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    return { is: true, highValue: 5 };
  }
  return { is: false, highValue: 0 };
}

/** Evaluate a 5-card hand and return its rank + tiebreakers */
function evaluate5(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const counts = valueCounts(sorted);
  const countEntries = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = isFlush(sorted);
  const { is: straight, highValue: straightHigh } = isStraight(sorted);

  // Royal Flush
  if (flush && straight && straightHigh === 14) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      rankName: HAND_RANK_NAMES[HandRank.ROYAL_FLUSH],
      bestFive: sorted,
      tiebreakers: [14],
    };
  }

  // Straight Flush
  if (flush && straight) {
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      rankName: HAND_RANK_NAMES[HandRank.STRAIGHT_FLUSH],
      bestFive: sorted,
      tiebreakers: [straightHigh],
    };
  }

  // Four of a Kind
  if (countEntries[0][1] === 4) {
    const quad = countEntries[0][0];
    const kicker = countEntries[1][0];
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      rankName: HAND_RANK_NAMES[HandRank.FOUR_OF_A_KIND],
      bestFive: sorted,
      tiebreakers: [quad, kicker],
    };
  }

  // Full House
  if (countEntries[0][1] === 3 && countEntries[1][1] === 2) {
    const trips = countEntries[0][0];
    const pair = countEntries[1][0];
    return {
      rank: HandRank.FULL_HOUSE,
      rankName: HAND_RANK_NAMES[HandRank.FULL_HOUSE],
      bestFive: sorted,
      tiebreakers: [trips, pair],
    };
  }

  // Flush
  if (flush) {
    return {
      rank: HandRank.FLUSH,
      rankName: HAND_RANK_NAMES[HandRank.FLUSH],
      bestFive: sorted,
      tiebreakers: sorted.map((c) => c.value),
    };
  }

  // Straight
  if (straight) {
    return {
      rank: HandRank.STRAIGHT,
      rankName: HAND_RANK_NAMES[HandRank.STRAIGHT],
      bestFive: sorted,
      tiebreakers: [straightHigh],
    };
  }

  // Three of a Kind
  if (countEntries[0][1] === 3) {
    const trips = countEntries[0][0];
    const kickers = countEntries
      .slice(1)
      .map(([v]) => v)
      .sort((a, b) => b - a);
    return {
      rank: HandRank.THREE_OF_A_KIND,
      rankName: HAND_RANK_NAMES[HandRank.THREE_OF_A_KIND],
      bestFive: sorted,
      tiebreakers: [trips, ...kickers],
    };
  }

  // Two Pair
  if (countEntries[0][1] === 2 && countEntries[1][1] === 2) {
    const highPair = Math.max(countEntries[0][0], countEntries[1][0]);
    const lowPair = Math.min(countEntries[0][0], countEntries[1][0]);
    const kicker = countEntries[2][0];
    return {
      rank: HandRank.TWO_PAIR,
      rankName: HAND_RANK_NAMES[HandRank.TWO_PAIR],
      bestFive: sorted,
      tiebreakers: [highPair, lowPair, kicker],
    };
  }

  // One Pair
  if (countEntries[0][1] === 2) {
    const pair = countEntries[0][0];
    const kickers = countEntries
      .slice(1)
      .map(([v]) => v)
      .sort((a, b) => b - a);
    return {
      rank: HandRank.ONE_PAIR,
      rankName: HAND_RANK_NAMES[HandRank.ONE_PAIR],
      bestFive: sorted,
      tiebreakers: [pair, ...kickers],
    };
  }

  // High Card
  return {
    rank: HandRank.HIGH_CARD,
    rankName: HAND_RANK_NAMES[HandRank.HIGH_CARD],
    bestFive: sorted,
    tiebreakers: sorted.map((c) => c.value),
  };
}

/**
 * Compare two evaluated hands. Returns:
 *  > 0 if a wins, < 0 if b wins, 0 if tie
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const diff = (a.tiebreakers[i] ?? 0) - (b.tiebreakers[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Find the best 5-card hand from 7 cards (hole cards + community).
 * Evaluates all C(7,5) = 21 combinations and returns the best.
 */
export function bestHandFrom7(cards: Card[]): EvaluatedHand {
  const combos = combinations(cards, 5);
  let best: EvaluatedHand | null = null;
  for (const combo of combos) {
    const evaluated = evaluate5(combo);
    if (!best || compareHands(evaluated, best) > 0) {
      best = evaluated;
    }
  }
  return best!;
}

export interface PlayerResult {
  playerId: number;
  hand: EvaluatedHand;
}

/**
 * Determine winners from a set of player hands + community cards.
 * Returns an array (can be multiple in case of a tie).
 */
export function determineWinners(
  players: Array<{ playerId: number; holeCards: Card[] }>,
  communityCards: Card[]
): PlayerResult[] {
  const results: PlayerResult[] = players.map(({ playerId, holeCards }) => ({
    playerId,
    hand: bestHandFrom7([...holeCards, ...communityCards]),
  }));

  // Sort descending (best hand first)
  results.sort((a, b) => compareHands(b.hand, a.hand));

  // Collect all players tied for first
  const best = results[0];
  return results.filter((r) => compareHands(r.hand, best.hand) === 0);
}
