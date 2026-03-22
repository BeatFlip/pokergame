-- ============================================================
-- 001_initial_schema.sql — Texas Hold'em Poker PWA
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type room_status as enum (
  'waiting',
  'playing',
  'finished'
);

create type player_status as enum (
  'waiting',
  'active',
  'folded',
  'all_in',
  'sitting_out',
  'left'
);

create type game_phase as enum (
  'waiting_for_players',
  'dealing',
  'pre_flop',
  'flop',
  'turn',
  'river',
  'showdown',
  'settlement'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Rooms (game lobbies)
create table public.rooms (
  id              bigint generated always as identity primary key,
  code            text not null unique,
  name            text not null,
  status          room_status not null default 'waiting',
  host_id         bigint,
  settings        jsonb not null default '{
    "small_blind": 10,
    "big_blind": 20,
    "starting_chips": 1000,
    "max_players": 9,
    "turn_timeout_seconds": 30
  }'::jsonb,
  created_at      timestamptz not null default now()
);

-- Players in a room (no Supabase Auth — ephemeral name+phone)
create table public.players (
  id              bigint generated always as identity primary key,
  room_id         bigint not null references public.rooms(id) on delete cascade,
  name            text not null,
  phone_number    text not null,
  seat_position   smallint,
  chip_count      integer not null default 1000,
  status          player_status not null default 'waiting',
  is_host         boolean not null default false,
  session_token   text not null,
  joined_at       timestamptz not null default now(),
  left_at         timestamptz
);

-- FK back-reference: rooms.host_id → players.id
alter table public.rooms
  add constraint rooms_host_id_fkey
  foreign key (host_id) references public.players(id)
  on delete set null;

-- Game state (one active row per room)
create table public.game_state (
  id                      bigint generated always as identity primary key,
  room_id                 bigint not null references public.rooms(id) on delete cascade,
  phase                   game_phase not null default 'waiting_for_players',
  community_cards         jsonb not null default '[]'::jsonb,
  pot                     jsonb not null default '{"main": 0, "side_pots": []}'::jsonb,
  current_turn_player_id  bigint references public.players(id) on delete set null,
  deck_seed               text,
  deck_remaining          jsonb not null default '[]'::jsonb,
  small_blind             integer not null default 10,
  big_blind               integer not null default 20,
  dealer_position         smallint not null default 0,
  round_number            integer not null default 1,
  last_aggressor_id       bigint references public.players(id) on delete set null,
  updated_at              timestamptz not null default now()
);

-- Player hands for current round
create table public.player_hands (
  id              bigint generated always as identity primary key,
  game_state_id   bigint not null references public.game_state(id) on delete cascade,
  player_id       bigint not null references public.players(id) on delete cascade,
  cards           jsonb not null default '[]'::jsonb,
  is_folded       boolean not null default false,
  is_all_in       boolean not null default false,
  current_bet     integer not null default 0,
  total_invested  integer not null default 0,
  action_taken    text,
  unique(game_state_id, player_id)
);

-- Chat messages
create table public.chat_messages (
  id          bigint generated always as identity primary key,
  room_id     bigint not null references public.rooms(id) on delete cascade,
  player_id   bigint references public.players(id) on delete set null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Settlements (final debt resolution)
create table public.settlements (
  id              bigint generated always as identity primary key,
  room_id         bigint not null references public.rooms(id) on delete cascade,
  from_player_id  bigint not null references public.players(id) on delete cascade,
  to_player_id    bigint not null references public.players(id) on delete cascade,
  amount          integer not null,
  is_paid         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index players_room_id_idx           on public.players(room_id);
create index players_session_token_idx     on public.players(session_token);
create index game_state_room_id_idx        on public.game_state(room_id);
create index player_hands_game_state_idx   on public.player_hands(game_state_id);
create index player_hands_player_id_idx    on public.player_hands(player_id);
create index chat_messages_room_id_idx     on public.chat_messages(room_id);
create index chat_messages_created_idx     on public.chat_messages(room_id, created_at desc);
create index settlements_room_id_idx       on public.settlements(room_id);

-- ============================================================
-- PUBLIC VIEW (strips server-only deck data)
-- ============================================================

create or replace view public.game_state_public as
  select
    id,
    room_id,
    phase,
    community_cards,
    pot,
    current_turn_player_id,
    small_blind,
    big_blind,
    dealer_position,
    round_number,
    last_aggressor_id,
    updated_at
    -- deck_seed and deck_remaining intentionally excluded
  from public.game_state;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- All writes go through service-role key in Route Handlers.
-- Reads use anon key with permissive policies.

alter table public.rooms          enable row level security;
alter table public.players        enable row level security;
alter table public.game_state     enable row level security;
alter table public.player_hands   enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.settlements    enable row level security;

-- Rooms: anyone can read
create policy "rooms_read_all" on public.rooms
  for select to anon, authenticated using (true);

-- Players: anyone can read
create policy "players_read_all" on public.players
  for select to anon, authenticated using (true);

-- Game state: anyone can read (deck fields stripped via view)
create policy "game_state_read_all" on public.game_state
  for select to anon, authenticated using (true);

-- Player hands: anyone can read metadata (cards hidden at app layer)
create policy "player_hands_read_all" on public.player_hands
  for select to anon, authenticated using (true);

-- Chat: anyone can read
create policy "chat_read_all" on public.chat_messages
  for select to anon, authenticated using (true);

-- Settlements: anyone can read
create policy "settlements_read_all" on public.settlements
  for select to anon, authenticated using (true);

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================

alter publication supabase_realtime add table public.game_state;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.player_hands;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.settlements;

-- ============================================================
-- TRIGGERS
-- ============================================================

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger game_state_updated_at
  before update on public.game_state
  for each row execute function public.update_updated_at();
