"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatChips, cn } from "@/lib/utils";
import type { BettingAction } from "@/types";

interface BettingControlsProps {
  canCheck: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  myChips: number;
  onAction: (action: BettingAction, amount?: number) => void;
  disabled?: boolean;
}

export function BettingControls({
  canCheck,
  callAmount,
  minRaise,
  maxRaise,
  myChips,
  onAction,
  disabled = false,
}: BettingControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaise, setShowRaise] = useState(false);

  const handleFold = () => onAction("fold");
  const handleCheck = () => onAction("check");
  const handleCall = () => onAction("call");
  const handleRaise = () => {
    onAction("raise", raiseAmount);
    setShowRaise(false);
  };
  const handleAllIn = () => onAction("all_in");

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "bg-surface-DEFAULT/95 backdrop-blur border-t border-surface-overlay",
        "px-4 pb-safe-bottom pt-3",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      )}
    >
      {/* Raise slider */}
      {showRaise && (
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Raise to</span>
            <span className="font-mono text-chip-gold font-bold">
              {formatChips(raiseAmount)}
            </span>
          </div>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor((maxRaise - minRaise) / 100))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-full accent-chip-gold"
          />
          <div className="flex gap-2">
            {[0.5, 0.75, 1].map((fraction) => {
              const amount = Math.floor(
                minRaise + (maxRaise - minRaise) * fraction
              );
              const label =
                fraction === 1 ? "Max" : `${Math.round(fraction * 100)}%`;
              return (
                <button
                  key={fraction}
                  onClick={() => setRaiseAmount(amount)}
                  className="flex-1 bg-surface-elevated border border-surface-overlay rounded-lg py-1.5 text-xs text-gray-300 hover:bg-surface-overlay transition-colors"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Fold */}
        <Button
          variant="danger"
          size="md"
          onClick={handleFold}
          disabled={disabled}
          className="flex-1"
        >
          Fold
        </Button>

        {/* Check or Call */}
        {canCheck ? (
          <Button
            variant="secondary"
            size="md"
            onClick={handleCheck}
            disabled={disabled}
            className="flex-1"
          >
            Check
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleCall}
            disabled={disabled || myChips === 0}
            className="flex-1"
          >
            Call{" "}
            <span className="font-mono ml-1 text-chip-gold">
              {formatChips(Math.min(callAmount, myChips))}
            </span>
          </Button>
        )}

        {/* Raise / confirm raise */}
        {!showRaise ? (
          <Button
            variant="gold"
            size="md"
            onClick={() => {
              setRaiseAmount(minRaise);
              setShowRaise(true);
            }}
            disabled={disabled || myChips <= callAmount}
            className="flex-1"
          >
            Raise
          </Button>
        ) : (
          <Button
            variant="gold"
            size="md"
            onClick={handleRaise}
            disabled={disabled}
            className="flex-1"
          >
            Confirm
          </Button>
        )}
      </div>

      {/* All-in button (shown when relevant) */}
      {myChips > 0 && (
        <button
          onClick={handleAllIn}
          disabled={disabled}
          className="w-full mt-2 text-xs text-gray-400 hover:text-card-red transition-colors py-1 disabled:opacity-40"
        >
          Go All-In ({formatChips(myChips)})
        </button>
      )}
    </div>
  );
}
