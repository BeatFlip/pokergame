import { notFound } from "next/navigation";
import { PlayerRegistration } from "@/components/lobby/PlayerRegistration";

interface RoomPageProps {
  params: { code: string };
}

async function getRoom(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/rooms/${code.toUpperCase()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const data = await getRoom(params.code);

  if (!data?.room) return notFound();

  return (
    <main className="min-h-dvh bg-felt-dark flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🃏</div>
          <h1 className="text-2xl font-display font-bold text-card-white">
            {data.room.name}
          </h1>
          <p className="text-chip-gold font-mono text-lg tracking-widest mt-1">
            {data.room.code}
          </p>
        </div>

        <div className="bg-surface-elevated border border-surface-overlay rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-card-white mb-4">
            Join the game
          </h2>
          <PlayerRegistration roomCode={params.code.toUpperCase()} />
        </div>
      </div>
    </main>
  );
}
