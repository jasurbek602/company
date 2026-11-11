-- Company IQ — Supabase sxemasi. Supabase Dashboard → SQL Editor'da bir marta ishga tushiring.

-- 1) Profil: premium holati va tokenlar
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  is_premium boolean not null default false,
  premium_since timestamptz,
  tokens integer not null default 0 check (tokens >= 0),
  created_at timestamptz not null default now()
);

-- Yangi foydalanuvchi ro'yxatdan o'tganda profil avtomatik yaratiladi
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) IQ natijalari
create table if not exists public.iq_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  iq integer not null check (iq between 40 and 200),
  percentile numeric,
  correct integer,
  total integer,
  duration_sec integer,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists iq_results_user_idx on public.iq_results(user_id, created_at desc);

-- 3) Detektiv progressi
create table if not exists public.detective_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  score integer not null,
  solved_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

-- RLS: har kim faqat o'z ma'lumotini ko'radi
alter table public.profiles enable row level security;
alter table public.iq_results enable row level security;
alter table public.detective_progress enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
-- Profilni mijoz to'g'ridan-to'g'ri o'zgartira olmaydi (premium/tokenlar faqat server yoki RPC orqali).

drop policy if exists "own results read" on public.iq_results;
create policy "own results read" on public.iq_results for select using (auth.uid() = user_id);
drop policy if exists "own results insert" on public.iq_results;
create policy "own results insert" on public.iq_results for insert with check (auth.uid() = user_id);

drop policy if exists "own cases read" on public.detective_progress;
create policy "own cases read" on public.detective_progress for select using (auth.uid() = user_id);
drop policy if exists "own cases write" on public.detective_progress;
create policy "own cases write" on public.detective_progress for insert with check (auth.uid() = user_id);

-- Bepul foydalanuvchi faqat 1 ta natija saqlay oladi (birinchi test bepul)
create or replace function public.enforce_free_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_premium from public.profiles where id = new.user_id), false)
     and (select count(*) from public.iq_results where user_id = new.user_id) >= 1 then
    raise exception 'Bepul test limiti tugagan. Premium kerak.';
  end if;
  return new;
end $$;
drop trigger if exists iq_free_limit on public.iq_results;
create trigger iq_free_limit before insert on public.iq_results
  for each row execute function public.enforce_free_limit();

-- Token qo'shish: faqat premium, bir martada maks 100
create or replace function public.add_tokens(amount integer) returns integer
language plpgsql security definer set search_path = public as $$
declare t integer;
begin
  if amount <= 0 or amount > 100 then raise exception 'Noto''g''ri miqdor'; end if;
  update public.profiles set tokens = tokens + amount
   where id = auth.uid() and is_premium
   returning tokens into t;
  if t is null then raise exception 'Premium talab qilinadi'; end if;
  return t;
end $$;
revoke all on function public.add_tokens(integer) from public, anon;
grant execute on function public.add_tokens(integer) to authenticated;
