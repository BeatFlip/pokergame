"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { WaitingRoom } from "./WaitingRoom";
import { useGameState } from "@/hooks/useGameState";
import { mapDbPlayer, mapDbRoom } from "@/lib/utils";
import type { DbRoom, DbPlayer } from "@/types";

interface RoomLobbyProps {
  roomCode: string;
  initialRoom: DbRoom;
  initialPlayers: DbPlayer[];
}

export function RoomLobby({
  roomCode,
  initialRoom,
  initialPlayers,
}: RoomLobbyProps) {
  const { setRoom, setPlayers, setMyPlayer } = useGameStore();

  useEffect(() => {
    setRoom(mapDbRoom(initialRoom));
    setPlayers(initialPlayers.map(mapDbPlayer));

    // Restore my player from localStorage
    const playerId = localStorage.getItem("player_id");
    if (playerId) {
      const me = initialPlayers.find((p) => p.id === Number(playerId));
      if (me) setMyPlayer(mapDbPlayer(me));
    }
  }, []);

  // Subscribe to Realtime updates
  useGameState(initialRoom.id, roomCode);

  return <WaitingRoom roomCode={roomCode} />;
}
