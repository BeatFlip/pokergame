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
        <div className="flex items-center gap-2 bg-bg-tertiary/80 rounded-full px-4 py-1.5 border border-border">
          <span className="font-mono font-bold text-accent-gold text-sm">
            Pot: {formatChips(total)}
          </span>
        </div>
      )}
      {pot.sidePots.map((sp, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-bg-tertiary/60 rounded-full px-3 py-0.5"
        >
          <span className="text-text-muted text-xs">Side {i + 1}:</span>
          <span className="font-mono text-text-secondary text-xs">
            {formatChips(sp.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
