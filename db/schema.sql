-- Supabase schema for the DSA tracking app.
-- Run this in the Supabase SQL editor or as a migration.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  streak_count integer not null default 0 check (streak_count >= 0),
  last_activity_date date,
  revision_intervals integer[] not null default array[1, 3, 7, 15, 30, 60, 120],
  constraint username_length check (username is null or char_length(username) between 3 and 50)
);

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.sheets (id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  unique (sheet_id, order_index)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  leetcode_url text,
  created_at timestamptz not null default now(),
  order_index integer not null default 0,
  unique (topic_id, order_index)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  is_solved boolean not null default false,
  solved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id),
  constraint solved_at_required_when_solved check (
    (is_solved = false and solved_at is null)
    or (is_solved = true and solved_at is not null)
  )
);

create table if not exists public.revision_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  revision_day integer not null check (revision_day > 0),
  due_date date not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id, revision_day),
  constraint completed_at_required_when_completed check (
    (is_completed = false and completed_at is null)
    or (is_completed = true and completed_at is not null)
  )
);

create index if not exists idx_topics_sheet_id on public.topics (sheet_id);
create index if not exists idx_questions_topic_id on public.questions (topic_id);
create index if not exists idx_user_progress_user_id on public.user_progress (user_id);
create index if not exists idx_user_progress_question_id on public.user_progress (question_id);
create index if not exists idx_revision_schedule_user_id on public.revision_schedule (user_id);
create index if not exists idx_revision_schedule_question_id on public.revision_schedule (question_id);
create index if not exists idx_revision_schedule_due_date on public.revision_schedule (due_date);
create index if not exists idx_revision_schedule_user_due on public.revision_schedule (user_id, due_date);

grant usage on schema public to authenticated;
grant select on public.sheets to authenticated;
grant select on public.topics to authenticated;
grant select on public.questions to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.revision_schedule to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_progress_updated_at on public.user_progress;
create trigger set_user_progress_updated_at
before update on public.user_progress
for each row
execute function public.set_updated_at();

drop trigger if exists set_revision_schedule_updated_at on public.revision_schedule;
create trigger set_revision_schedule_updated_at
before update on public.revision_schedule
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sheets enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.user_progress enable row level security;
alter table public.revision_schedule enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Authenticated users can read sheets" on public.sheets;
create policy "Authenticated users can read sheets"
on public.sheets
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read topics" on public.topics;
create policy "Authenticated users can read topics"
on public.topics
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read questions" on public.questions;
create policy "Authenticated users can read questions"
on public.questions
for select
to authenticated
using (true);

drop policy if exists "Users can read own progress" on public.user_progress;
create policy "Users can read own progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own progress" on public.user_progress;
create policy "Users can insert own progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own progress" on public.user_progress;
create policy "Users can update own progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own progress" on public.user_progress;
create policy "Users can delete own progress"
on public.user_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own revision schedule" on public.revision_schedule;
create policy "Users can read own revision schedule"
on public.revision_schedule
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own revision schedule" on public.revision_schedule;
create policy "Users can insert own revision schedule"
on public.revision_schedule
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own revision schedule" on public.revision_schedule;
create policy "Users can update own revision schedule"
on public.revision_schedule
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own revision schedule" on public.revision_schedule;
create policy "Users can delete own revision schedule"
on public.revision_schedule
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    left(
      regexp_replace(
        lower(
          coalesce(
            nullif(new.raw_user_meta_data->>'username', ''),
            nullif(split_part(new.email, '@', 1), ''),
            'user'
          )
        ),
        '[^a-z0-9_]+',
        '_',
        'g'
      ),
      40
    ) || '_' || replace(left(new.id::text, 8), '-', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
