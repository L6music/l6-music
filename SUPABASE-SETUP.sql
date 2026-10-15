create table if not exists public.tracks (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100),
 artist text not null check (char_length(artist) between 1 and 100),
 genre text not null default 'Other',
 audio_path text not null,
 art_path text,
 created_at timestamptz not null default now(),
 constraint owner_audio_path check (audio_path like owner_id::text || '/%'),
 constraint owner_art_path check (art_path is null or art_path like owner_id::text || '/%')
);
alter table public.tracks enable row level security;
drop policy if exists "Everyone can read tracks" on public.tracks;
create policy "Everyone can read tracks" on public.tracks for select to anon,authenticated using (true);
drop policy if exists "Artists insert own tracks" on public.tracks;
create policy "Artists insert own tracks" on public.tracks for insert to authenticated with check (owner_id=auth.uid());
-- Makes songs publicly streamable. Only store music intended for public release.
insert into storage.buckets (id,name,public,file_size_limit)
values ('l6-music','l6-music',true,41943040)
on conflict (id) do update set public=true,file_size_limit=41943040;
drop policy if exists "Artists upload to own folder" on storage.objects;
create policy "Artists upload to own folder" on storage.objects for insert to authenticated
with check (bucket_id='l6-music' and (storage.foldername(name))[1]=auth.uid()::text);
