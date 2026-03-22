"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateRoom() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Enter a room name");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create room");
        return;
      }

      router.push(`/room/${data.room.code}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="room-name"
        label="Room name"
        placeholder="e.g. Friday Night Poker"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        error={error}
        maxLength={50}
        autoFocus
      />
      <Button
        variant="gold"
        size="lg"
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="w-full"
      >
        {loading ? "Creating..." : "Create Game"}
      </Button>
    </div>
  );
}
