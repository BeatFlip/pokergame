import { CreateRoom } from "@/components/lobby/CreateRoom";
import { JoinRoom } from "@/components/lobby/JoinRoom";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-bg-primary flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
      {/* Logo / title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-bold text-text-primary tracking-wide">
          Poker Night
        </h1>
        <p className="text-text-muted mt-2 text-sm">Private Texas Hold&apos;em with friends</p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Create room */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Start a game
          </h2>
          <CreateRoom />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-sm">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join room */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Join a game
          </h2>
          <JoinRoom />
        </div>
      </div>
    </main>
  );
}
