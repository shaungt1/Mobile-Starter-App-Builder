-- Added by the "funnel" feature (onboarding flow + full paywall from the upstream
-- Simonstorms template). Stores each completed onboarding's answers per user and
-- marks the profile as onboarded. Same pattern as 0001: explicit grants plus RLS.

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_responses_user_id_idx
  on public.onboarding_responses (user_id);

alter table public.onboarding_responses enable row level security;

revoke all on table public.onboarding_responses from anon, authenticated;
grant select, insert, delete on table public.onboarding_responses to authenticated;

create policy "onboarding_select_own" on public.onboarding_responses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "onboarding_insert_own" on public.onboarding_responses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "onboarding_delete_own" on public.onboarding_responses
  for delete to authenticated using ((select auth.uid()) = user_id);
