"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PokerTable } from "@/components/game/PokerTable";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SettlementScreen } from "@/components/settlement/SettlementScreen";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { useGameStore } from "@/store/gameStore";
import { useGameState } from "@/hooks/useGameState";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useChatMessages } from "@/hooks/useChatMessages";
import { mapDbPlayer, mapDbRoom, mapDbGameState } from "@/lib/utils";

interface GamePageProps {
  params: { code: string };
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();
  const code = params.code.toUpperCase();
  const [roomId, setRoomId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);

  const { gameState, setRoom, setPlayers, setMyPlayer, setGameState } =
    useGameStore();

  // Bootstrap from API on mount
  useEffect(() => {
    const sessionToken = localStorage.getItem("session_token");
    const storedRoomCode = localStorage.getItem("room_code");

    if (!sessionToken || storedRoomCode !== code) {
      router.replace(`/room/${code}`);
      return;
    }

    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.room) {
          router.replace("/");
          return;
        }

        setRoom(mapDbRoom(data.room));
        setPlayers((data.players ?? []).map(mapDbPlayer));
        if (data.gameState) setGameState(mapDbGameState(data.gameState));

        setRoomId(data.room.id);

        const playerId = localStorage.getItem("player_id");
        if (playerId) {
          const me = (data.players ?? []).find(
            (p: { id: number }) => p.id === Number(playerId)
          );
          if (me) setMyPlayer(mapDbPlayer(me));
        }

        setInitializing(false);
      })
      .catch(() => router.replace("/"));
  }, [code]);

  // Realtime subscriptions (only after we have a roomId)
  useGameState(roomId ?? 0, code);
  usePlayerState(code);
  useChatMessages(roomId ?? 0, code);

  if (initializing || !roomId) {
    return (
      <div className="min-h-dvh bg-felt-dark flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading game...</div>
      </div>
    );
  }

  const phase = gameState?.phase;

  // Waiting for players / host to start
  if (!phase || phase === "waiting_for_players") {
    return (
      <main className="min-h-dvh bg-felt-dark flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold text-card-white">
              {code}
            </h1>
          </div>
          <div className="bg-surface-elevated border border-surface-overlay rounded-2xl p-5">
            <WaitingRoom roomCode={code} />
          </div>
        </div>
        <ChatPanel />
      </main>
    );
  }

  // Settlement
  if (phase === "settlement") {
    return (
      <>
        <SettlementScreen roomCode={code} />
        <ChatPanel />
      </>
    );
  }

  // Active game
  return (
    <>
      <PokerTable roomCode={code} />
      <ChatPanel />
    </>
  );
}
