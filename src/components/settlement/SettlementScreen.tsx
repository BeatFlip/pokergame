"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { VippsButton } from "./VippsButton";
import { formatChips, formatChipDelta } from "@/lib/utils";
import { enrichTransactionsWithVipps } from "@/lib/poker/settlement";
import type { PlayerBalance, Transaction } from "@/types";

interface SettlementScreenProps {
  roomCode: string;
}

export function SettlementScreen({ roomCode: _roomCode }: SettlementScreenProps) {
  const { myPlayer } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<
    Array<Transaction & { vippsUrl: string }>
  >([]);
  const [balances, setBalances] = useState<PlayerBalance[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleEndGame = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/game/settlement", {
        method: "POST",
        headers: { "x-session-token": sessionToken },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Settlement failed");
        return;
      }

      const enriched = enrichTransactionsWithVipps(data.transactions);
      setTransactions(enriched);
      setBalances(data.balances);
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!done && myPlayer?.isHost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-felt-dark px-6 gap-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-display font-bold text-chip-gold mb-2">
            End the Game
          </h2>
          <p className="text-gray-400 text-sm">
            This will calculate who owes who and generate Vipps payment links.
          </p>
        </div>
        {error && <p className="text-card-red text-sm">{error}</p>}
        <button
          onClick={handleEndGame}
          disabled={loading}
          className="w-full max-w-sm bg-chip-gold text-felt-dark font-bold py-4 rounded-2xl text-lg active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading ? "Calculating..." : "End Game & Settle Up"}
        </button>
      </div>
    );
  }

  if (!done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-felt-dark">
        <p className="text-gray-400">Waiting for host to end the game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-dark px-4 pt-safe-top pb-safe-bottom">
      <div className="max-w-md mx-auto py-6 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-display font-bold text-chip-gold">
            Game Over
          </h1>
        </div>

        {/* Player balances */}
        <div className="bg-surface-elevated border border-surface-overlay rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Results
          </h3>
          {balances
            .sort((a, b) => b.netBalance - a.netBalance)
            .map((b) => (
              <div
                key={b.playerId}
                className="flex items-center justify-between"
              >
                <span className="font-medium text-card-white">{b.playerName}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-300">
                    {formatChips(b.finalChips)} chips
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      b.netBalance >= 0 ? "text-green-400" : "text-card-red"
                    }`}
                  >
                    {formatChipDelta(b.netBalance)}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Transactions */}
        {transactions.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Payments ({transactions.length} transfer
              {transactions.length > 1 ? "s" : ""})
            </h3>
            {transactions.map((t, i) => (
              <div
                key={i}
                className="bg-surface-elevated border border-surface-overlay rounded-2xl p-4 flex flex-col gap-3"
              >
                <p className="text-sm text-gray-300">
                  <span className="text-card-white font-medium">
                    {t.fromName}
                  </span>{" "}
                  pays{" "}
                  <span className="text-chip-gold font-mono font-bold">
                    {formatChips(t.amount)}
                  </span>{" "}
                  to{" "}
                  <span className="text-card-white font-medium">{t.toName}</span>
                </p>
                <VippsButton
                  toName={t.toName}
                  toPhone={t.toPhone}
                  amount={t.amount}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No payments needed — everyone is even!
          </div>
        )}
      </div>
    </div>
  );
}
