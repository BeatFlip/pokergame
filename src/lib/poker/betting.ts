import type { Pot, SidePot } from "@/types";

export interface PlayerInvestment {
  playerId: number;
  totalInvested: number;
  isAllIn: boolean;
  isFolded: boolean;
}

/**
 * Calculate side pots when one or more players are all-in.
 * Returns the main pot and any side pots with eligible player lists.
 */
export function calculatePots(players: PlayerInvestment[]): Pot {
  const activePlayers = players.filter((p) => !p.isFolded);
  if (activePlayers.length === 0) return { main: 0, sidePots: [] };

  // Sort by total invested ascending
  const sorted = [...activePlayers].sort(
    (a, b) => a.totalInvested - b.totalInvested
  );

  const sidePots: SidePot[] = [];
  let previousLevel = 0;

  for (let i = 0; i < sorted.length; i++) {
    const level = sorted[i].totalInvested;
    if (level <= previousLevel) continue;

    const potAmount =
      (level - previousLevel) *
      players.filter((p) => p.totalInvested >= level && !p.isFolded).length +
      // Also add from folded players who contributed up to this level
      players
        .filter((p) => p.isFolded && p.totalInvested > previousLevel)
        .reduce((sum, p) => sum + Math.min(p.totalInvested, level) - previousLevel, 0);

    const eligiblePlayerIds = activePlayers
      .filter((p) => p.totalInvested >= level)
      .map((p) => p.playerId);

    sidePots.push({ amount: potAmount, eligiblePlayerIds });
    previousLevel = level;
  }

  // Combine into main pot (last players eligible for all) + side pots
  const mainPot = sidePots.reduce((sum, sp) => sum + sp.amount, 0);

  return {
    main: mainPot,
    sidePots: sidePots.length > 1 ? sidePots.slice(0, -1) : [],
  };
}

/**
 * Determine if the current betting round is complete.
 * Complete when all active (non-folded, non-all-in) players have
 * matched the highest bet AND the action has gone around at least once.
 */
export function isBettingRoundComplete(
  playerHands: Array<{
    playerId: number;
    isFolded: boolean;
    isAllIn: boolean;
    currentBet: number;
    actionTaken: string | null;
  }>,
  _lastAggressorId: number | null
): boolean {
  const activePlayers = playerHands.filter((p) => !p.isFolded && !p.isAllIn);

  // Only 0 or 1 active players → round over
  if (activePlayers.length <= 1) return true;

  // Find the highest bet in this round
  const maxBet = Math.max(...playerHands.map((p) => p.currentBet));

  // All active players must have acted AND matched the max bet
  return activePlayers.every(
    (p) => p.actionTaken !== null && p.currentBet === maxBet
  );
}

/** Get the next active player after the given seat position (circular) */
export function getNextActivePlayer(
  players: Array<{ id: number; seatPosition: number | null; status: string }>,
  currentPlayerId: number
): number | null {
  const seated = players
    .filter((p) => p.seatPosition !== null && p.status === "active")
    .sort((a, b) => a.seatPosition! - b.seatPosition!);

  if (seated.length === 0) return null;

  const currentIdx = seated.findIndex((p) => p.id === currentPlayerId);
  if (currentIdx === -1) return seated[0].id;

  const nextIdx = (currentIdx + 1) % seated.length;
  return seated[nextIdx].id;
}

/** Validate a bet action */
export function validateBetAction(
  action: string,
  amount: number | undefined,
  currentBet: number,
  maxBet: number,
  chipCount: number,
  bigBlind: number
): { valid: boolean; error?: string } {
  if (action === "check" && maxBet > currentBet) {
    return { valid: false, error: "Cannot check when there is a bet to call" };
  }
  if (action === "call" && maxBet === currentBet) {
    return { valid: false, error: "No bet to call — use check" };
  }
  if (action === "raise") {
    if (!amount || amount <= 0) {
      return { valid: false, error: "Raise amount required" };
    }
    const totalRaise = amount;
    const minRaise = maxBet + bigBlind;
    if (totalRaise < minRaise && totalRaise < chipCount + currentBet) {
      return {
        valid: false,
        error: `Minimum raise is ${minRaise} chips`,
      };
    }
  }
  return { valid: true };
}
