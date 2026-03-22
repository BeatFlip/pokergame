import type { PlayerBalance, Transaction } from "@/types";
import { buildVippsDeeplink } from "@/lib/vipps";

/**
 * Calculate the minimum set of payment transactions to settle all debts.
 *
 * Algorithm: Net balance + greedy debt cancellation
 * - Complexity: O(N log N)
 * - Result: at most N-1 transactions for N players (optimal bound)
 *
 * Positive netBalance = won chips (creditor, should receive money)
 * Negative netBalance = lost chips (debtor, owes money)
 */
export function calculateSettlement(players: PlayerBalance[]): Transaction[] {
  // Separate creditors and debtors, sort largest first
  const creditors = players
    .filter((p) => p.netBalance > 0)
    .map((p) => ({ ...p, remaining: p.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = players
    .filter((p) => p.netBalance < 0)
    .map((p) => ({ ...p, remaining: Math.abs(p.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions: Transaction[] = [];
  let ci = 0;
  let di = 0;

  // Greedy matching: each iteration fully settles at least one side
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.remaining, debtor.remaining);

    if (amount > 0) {
      transactions.push({
        fromPlayerId: debtor.playerId,
        fromName: debtor.playerName,
        toPlayerId: creditor.playerId,
        toName: creditor.playerName,
        toPhone: creditor.phone,
        amount,
      });
    }

    creditor.remaining -= amount;
    debtor.remaining -= amount;

    if (creditor.remaining === 0) ci++;
    if (debtor.remaining === 0) di++;
  }

  return transactions;
}

/**
 * Build PlayerBalance entries from player data.
 * startingChips comes from room settings; finalChips from current chip_count.
 */
export function buildPlayerBalances(
  players: Array<{
    id: number;
    name: string;
    phoneNumber: string;
    chipCount: number;
  }>,
  startingChips: number
): PlayerBalance[] {
  return players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    phone: p.phoneNumber,
    startingChips,
    finalChips: p.chipCount,
    netBalance: p.chipCount - startingChips,
  }));
}

/** Add Vipps URLs to transactions (computed client-side) */
export function enrichTransactionsWithVipps(
  transactions: Transaction[]
): Array<Transaction & { vippsUrl: string }> {
  return transactions.map((t) => ({
    ...t,
    vippsUrl: buildVippsDeeplink(t.toPhone),
  }));
}
