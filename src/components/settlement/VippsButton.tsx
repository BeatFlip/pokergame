import { buildVippsDeeplink } from "@/lib/vipps";
import { formatChips } from "@/lib/utils";

interface VippsButtonProps {
  toName: string;
  toPhone: string;
  amount: number;
}

export function VippsButton({ toName, toPhone, amount }: VippsButtonProps) {
  const url = buildVippsDeeplink(toPhone);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 bg-[#ff5b24] hover:bg-[#e05020] text-white font-bold rounded-xl px-4 py-3 min-h-[48px] transition-colors active:scale-95 select-none w-full"
    >
      <span className="text-lg">⚡</span>
      <span className="text-sm">
        Pay {formatChips(amount)} to {toName} via Vipps
      </span>
    </a>
  );
}
