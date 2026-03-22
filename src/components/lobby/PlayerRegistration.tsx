"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidNorwegianPhone } from "@/lib/vipps";

interface PlayerRegistrationProps {
  roomCode: string;
}

export function PlayerRegistration({ roomCode }: PlayerRegistrationProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+47");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validate = () => {
    const errs: { name?: string; phone?: string } = {};
    if (!name.trim()) errs.name = "Enter your name";
    if (!isValidNorwegianPhone(phone))
      errs.phone = "Enter a valid Norwegian number (+47XXXXXXXX)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleJoin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms/${roomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phoneNumber: phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ name: data.error });
        return;
      }

      // Store session token in localStorage
      localStorage.setItem("session_token", data.sessionToken);
      localStorage.setItem("player_id", String(data.player.id));
      localStorage.setItem("room_code", roomCode);

      router.push(`/room/${roomCode}/game`);
    } catch {
      setErrors({ name: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Input
        id="player-name"
        label="Your name"
        placeholder="e.g. Filip"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={30}
        autoFocus
        autoComplete="given-name"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-gray-300">
          Phone number
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-gray-400 font-mono text-base select-none">
            +47
          </span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="XXX XX XXX"
            value={phone.replace("+47", "")}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
              setPhone(`+47${digits}`);
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className={`w-full bg-surface-elevated border ${
              errors.phone ? "border-card-red" : "border-surface-overlay"
            } rounded-xl text-card-white placeholder:text-gray-500 py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-chip-gold focus:border-transparent transition-all min-h-[48px] font-mono`}
            autoComplete="tel-local"
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-card-red" role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      <Button
        variant="gold"
        size="lg"
        onClick={handleJoin}
        disabled={loading}
        className="w-full mt-2"
      >
        {loading ? "Joining..." : "Join Game"}
      </Button>
    </div>
  );
}
