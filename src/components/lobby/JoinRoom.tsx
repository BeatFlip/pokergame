"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidRoomCode } from "@/lib/roomCode";

export function JoinRoom() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    const upper = code.toUpperCase().trim();
    if (!isValidRoomCode(upper)) {
      setError("Enter a valid 6-character room code");
      return;
    }
    router.push(`/room/${upper}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="room-code"
        label="Room code"
        placeholder="KXRT7B"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase().slice(0, 6));
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        error={error}
        className="tracking-widest text-center text-xl font-mono uppercase"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />
      <Button
        variant="primary"
        size="lg"
        onClick={handleJoin}
        disabled={code.length < 6}
        className="w-full"
      >
        Join Game
      </Button>
    </div>
  );
}
