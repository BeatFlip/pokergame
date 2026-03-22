import type { Card, Rank, Suit } from "@/types";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
};

/** Create a standard 52-card deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic from a numeric seed — same seed always produces same shuffle.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a UUID-like string seed to a numeric seed */
function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle with a string seed for determinism.
 * The seed is stored server-side so the shuffle can be audited.
 */
export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];
  const rng = mulberry32(seedToNumber(seed));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Draw n cards from the top of the deck, return [drawn, remaining] */
export function drawCards(deck: Card[], n: number): [Card[], Card[]] {
  return [deck.slice(0, n), deck.slice(n)];
}

/** Generate a random seed string */
export function generateDeckSeed(): string {
  return Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
