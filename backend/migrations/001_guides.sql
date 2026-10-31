-- ARCHITECTURE §8. Service-role only: RLS is enabled with NO policies on both tables,
-- so anon/authenticated keys read and write nothing; only the backend service role bypasses RLS.
create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,        -- sha256 of the 128-bit URL token; raw token never stored
  delete_key_hash text not null,
  goal text not null,
  steps jsonb not null,                   -- [{n, instruction, target, svg_path, svg_origin, image_path, width, height}]
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

-- Callers always pass p_expires_at: IP-hash buckets now + window (purged <=48 h, ARCH §8),
-- spend:<date> now + 48 h, spend:total now + 3650 days so the $60 total cap outlives the demo.
create table if not exists usage_counters (
  bucket text primary key,                -- 'ip:<salted-hash>:<yyyy-mm-dd>' or 'spend:<yyyy-mm-dd>'
  count integer not null default 0,
  cents numeric not null default 0,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours'
);

alter table guides enable row level security;   -- no policies: only the backend service role can read/write
alter table usage_counters enable row level security;

insert into storage.buckets (id, name, public) values ('guides', 'guides', false)
on conflict (id) do nothing;

create or replace function increment_counter(
  p_bucket text,
  p_count integer,
  p_cents numeric,
  p_expires_at timestamptz
) returns table(count integer, cents numeric)
language sql
as $$
  insert into usage_counters (bucket, count, cents, expires_at)
  values (p_bucket, p_count, p_cents, coalesce(p_expires_at, now() + interval '48 hours'))
  on conflict (bucket) do update
    set count = usage_counters.count + excluded.count,
        cents = usage_counters.cents + excluded.cents,
        expires_at = coalesce(p_expires_at, usage_counters.expires_at),
        updated_at = now()
  returning usage_counters.count, usage_counters.cents;
$$;

-- Only the backend service role may bump counters (default grants would let anon call it; RLS makes it a no-op today, revoke anyway).
revoke execute on function increment_counter(text, integer, numeric, timestamptz) from public, anon, authenticated;
