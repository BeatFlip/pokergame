# PokerGame — Texas Hold'em PWA

## Stack
- **Next.js 14** App Router + TypeScript (`src/` dir, `@/*` alias)
- **Supabase** — Postgres + Realtime CDC (no Auth — ephemeral session tokens)
- **Tailwind CSS** — poker theme tokens in `tailwind.config.ts`
- **Zustand** — client game state store (`src/store/gameStore.ts`)
- **Vercel** — production deployment, linked to GitHub `pokergame` repo

## Commands
```
npm run dev        # local dev server
npm run build      # production build
npm run lint       # ESLint
```

## Architecture
- All DB writes use **service-role key** via Route Handlers (`src/app/api/`)
- Client uses **anon key** for reads + Supabase Realtime subscriptions only
- Players are ephemeral: `session_token` (UUID) issued at join, stored in `localStorage`
- Hole cards (`player_hands.cards`) are **never** sent via Realtime — fetched once via `/api/game/my-hand`
- `deck_seed` and `deck_remaining` are stripped from Realtime via `game_state_public` view

## Key Directories
- `src/lib/poker/` — game logic: deck, evaluator, stateMachine, betting, settlement
- `src/lib/supabase/` — `client.ts` (browser singleton), `server.ts` (service-role)
- `src/hooks/` — Realtime subscription hooks
- `src/store/gameStore.ts` — Zustand store (all client UI state)
- `src/types/index.ts` — all TypeScript interfaces (single source of truth)
- `supabase/migrations/` — DB schema

## Database
6 tables: `rooms`, `players`, `game_state`, `player_hands`, `chat_messages`, `settlements`
All use `bigint generated always as identity` PKs (not UUIDs).
RLS enabled; reads are permissive (anon); writes via service-role only.

## Game Flow
`waiting_for_players → dealing → pre_flop → flop → turn → river → showdown → settlement`
Phase transitions are server-side only (Route Handlers). Clients read via Realtime CDC.

## Settlement
Min-transactions algorithm in `src/lib/poker/settlement.ts`.
Vipps deeplinks: `https://qr.vipps.no/28/2/01/031/47XXXXXXXX?v=1` (no API key needed).

## PWA
- `public/manifest.json` — `display: standalone`, poker theme colors
- `public/sw.js` — cache-first static, network-first API
- iOS meta tags in `src/app/layout.tsx`
