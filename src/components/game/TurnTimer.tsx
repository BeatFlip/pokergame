"use client";

import { useEffect, useState } from "react";
import { getTurnSecondsRemaining } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TurnTimerProps {
  updatedAt: string;
  timeoutSeconds: number;
  isMyTurn: boolean;
  onTimeout?: () => void;
}

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TurnTimer({
  updatedAt,
  timeoutSeconds,
  isMyTurn,
  onTimeout,
}: TurnTimerProps) {
  const [remaining, setRemaining] = useState(timeoutSeconds);

  useEffect(() => {
    const update = () => {
      const r = getTurnSecondsRemaining(updatedAt, timeoutSeconds);
      setRemaining(r);
      if (r === 0) onTimeout?.();
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [updatedAt, timeoutSeconds, onTimeout]);

  const progress = remaining / timeoutSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const isUrgent = remaining <= 10;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="48" height="48" className="timer-ring">
        {/* Background ring */}
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="#374151"
          strokeWidth="3"
        />
        {/* Progress ring */}
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke={isUrgent ? "#c0392b" : isMyTurn ? "#c9a74a" : "#235c38"}
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-250"
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-mono font-bold",
          isUrgent
            ? "text-card-red animate-pulse"
            : isMyTurn
            ? "text-chip-gold"
            : "text-gray-400"
        )}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}
