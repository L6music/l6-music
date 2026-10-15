-- L6 Music v1.1: approved-artist publishing gate.
-- Run in Supabase SQL Editor as project administrator.
-- Non-destructive: does not delete or modify tracks, users, or stored audio.
begin;
create table if not exists public.approved_artists (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now()
);
alter table public.approved_artists enable row level security;
-- Existing publishing accounts keep access; new accounts require explicit approval.
insert into public.approved_artists(user_id)
select distinct owner_id from public.tracks
on conflict (user_id) do nothing;
revoke all on public.approved_artists from anon, authenticated;
grant select on public.approved_artists to authenticated;
drop policy if exists "Artists see own approval" on public.approved_artists;
create policy "Artists see own approval" on public.approved_artists
for select to authenticated using (user_id = (select auth.uid()));
-- Do not touch public track-reading policies or existing song data.
alter table public.tracks enable row level security;
drop policy if exists "Artists insert own tracks" on public.tracks;
create policy "Artists insert own tracks" on public.tracks
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.approved_artists a where a.user_id = (select auth.uid()))
);
-- Keep public access for existing streams; only change upload authorization.
drop policy if exists "Artists upload to own folder" on storage.objects;
create policy "Artists upload to own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'l6-music'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.approved_artists a where a.user_id = (select auth.uid()))
);
commit;
-- Read-only verification after running:
-- select (select count(*) from public.approved_artists) as approved_artists,
--        (select count(*) from public.tracks) as published_tracks;
