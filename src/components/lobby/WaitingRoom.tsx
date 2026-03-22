"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/store/gameStore";
import { formatChips } from "@/lib/utils";

interface WaitingRoomProps {
  roomCode: string;
}

export function WaitingRoom({ roomCode }: WaitingRoomProps) {
  const { players, myPlayer, room } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activePlayers = players.filter(
    (p) => p.status !== "left" && p.status !== "sitting_out"
  );

  const handleStart = async () => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/game/deal", {
        method: "POST",
        headers: { "x-session-token": sessionToken },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to start game");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Room code display */}
      <div
        className="bg-surface-elevated border border-surface-overlay rounded-2xl p-4 text-center cursor-pointer active:scale-95 transition-transform"
        onClick={copyCode}
      >
        <p className="text-sm text-gray-400 mb-1">Room code</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-chip-gold">
          {roomCode}
        </p>
        <p className="text-xs text-gray-500 mt-1">Tap to copy</p>
      </div>

      {/* Players list */}
      <div>
        <p className="text-sm text-gray-400 mb-3">
          Players ({activePlayers.length}/
          {room?.settings.maxPlayers ?? 9})
        </p>
        <div className="flex flex-col gap-2">
          {activePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-surface-elevated rounded-xl px-4 py-3 border border-surface-overlay"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    player.isHost ? "bg-chip-gold" : "bg-felt-light"
                  }`}
                />
                <span className="font-medium text-card-white">
                  {player.name}
                  {player.id === myPlayer?.id && (
                    <span className="text-gray-400 text-sm ml-2">(you)</span>
                  )}
                </span>
                {player.isHost && (
                  <span className="text-xs text-chip-gold border border-chip-gold/30 rounded px-1.5 py-0.5">
                    Host
                  </span>
                )}
              </div>
              <span className="font-mono text-sm text-gray-300">
                {formatChips(player.chipCount)} chips
              </span>
            </div>
          ))}

          {activePlayers.length === 0 && (
            <p className="text-gray-500 text-center py-4">Waiting for players...</p>
          )}
        </div>
      </div>

      {/* Start game button (host only) */}
      {myPlayer?.isHost && (
        <div className="flex flex-col gap-2">
          {error && <p className="text-card-red text-sm text-center">{error}</p>}
          <Button
            variant="gold"
            size="lg"
            onClick={handleStart}
            disabled={loading || activePlayers.length < 2}
            className="w-full"
          >
            {loading
              ? "Starting..."
              : activePlayers.length < 2
              ? "Need at least 2 players"
              : "Start Game"}
          </Button>
        </div>
      )}

      {!myPlayer?.isHost && (
        <p className="text-center text-gray-500 text-sm">
          Waiting for host to start the game...
        </p>
      )}
    </div>
  );
}
