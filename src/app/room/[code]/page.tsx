import { notFound } from "next/navigation";
import { PlayerRegistration } from "@/components/lobby/PlayerRegistration";
import { getSupabaseAdmin } from "@/lib/supabase/server";

interface RoomPageProps {
  params: { code: string };
}

async function getRoom(code: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, code, name, status, settings")
      .eq("code", code.toUpperCase())
      .single();
    return room ? { room } : null;
  } catch {
    return null;
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const data = await getRoom(params.code);

  if (!data?.room) return notFound();

  return (
    <main className="min-h-dvh bg-bg-primary flex flex-col items-center justify-center px-6 pt-safe-top pb-safe-bottom">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            {data.room.name}
          </h1>
          <p className="text-accent-gold font-mono text-lg tracking-widest mt-1">
            {data.room.code}
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Join the game
          </h2>
          <PlayerRegistration roomCode={params.code.toUpperCase()} />
        </div>
      </div>
    </main>
  );
}
