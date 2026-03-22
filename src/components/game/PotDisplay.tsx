import { formatChips } from "@/lib/utils";
import type { Pot } from "@/types";

interface PotDisplayProps {
  pot: Pot;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  const total =
    pot.main + pot.sidePots.reduce((s, sp) => s + sp.amount, 0);

  return (
    <div className="flex flex-col items-center gap-1">
      {total > 0 && (
        <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-1.5 border border-white/10">
          <span className="text-chip-gold text-sm">🏆</span>
          <span className="font-mono font-bold text-chip-gold text-sm">
            {formatChips(total)}
          </span>
        </div>
      )}
      {pot.sidePots.map((sp, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-0.5"
        >
          <span className="text-gray-400 text-xs">Side {i + 1}:</span>
          <span className="font-mono text-gray-300 text-xs">
            {formatChips(sp.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
