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
import { mapDbGameState } from "@/lib/utils";
import type { Player } from "@/types";

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

        setRoom(data.room);
        setPlayers(data.players ?? []);
        if (data.gameState) setGameState(mapDbGameState(data.gameState));

        setRoomId(data.room.id);

        const playerId = localStorage.getItem("player_id");
        if (playerId) {
          const me = (data.players ?? []).find(
            (p: Player) => p.id === Number(playerId)
          );
          if (me) setMyPlayer(me);
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
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading game...</div>
      </div>
    );
  }

  const phase = gameState?.phase;

  // Waiting for players / host to start
  if (!phase || phase === "waiting_for_players") {
    return (
      <main className="min-h-dvh bg-bg-primary flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {code}
            </h1>
          </div>
          <WaitingRoom roomCode={code} />
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

  // Active game (pre_flop, flop, turn, river, showdown)
  return (
    <>
      <PokerTable roomCode={code} />
      <ChatPanel />
    </>
  );
}
