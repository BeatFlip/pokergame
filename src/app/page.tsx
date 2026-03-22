import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-felt-dark flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
      {/* Logo / title */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🃏</div>
        <h1 className="text-4xl font-display font-bold text-chip-gold tracking-wide">
          Poker Night
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Texas Hold&apos;em with friends</p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Create room */}
        <div className="bg-surface-elevated border border-surface-overlay rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-card-white mb-4">
            Start a game
          </h2>
          <CreateRoom />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-overlay" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-surface-overlay" />
        </div>

        {/* Join room */}
        <div className="bg-surface-elevated border border-surface-overlay rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-card-white mb-4">
            Join a game
          </h2>
          <JoinRoom />
        </div>
      </div>
    </main>
  );
}
