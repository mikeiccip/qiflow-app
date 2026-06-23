-- Phase 16: Extend workshops table + workshops Storage bucket

alter table public.workshops
  add column if not exists slug              text unique,
  add column if not exists thumbnail_url     text,
  add column if not exists duration_minutes  int,
  add column if not exists category          text not null default 'general',
  add column if not exists constitution_tags text[] not null default '{}',
  add column if not exists is_members_only   boolean not null default true,
  add column if not exists is_hidden         boolean not null default false;

create unique index if not exists workshops_slug_idx on public.workshops (slug)
  where slug is not null;

-- Storage bucket: workshop PDFs (private — public, false — signed URLs only)
insert into storage.buckets (id, name, public)
values ('workshops', 'workshops', false)
on conflict (id) do nothing;

create policy "workshops storage: member read"
  on storage.objects for select
  using (
    bucket_id = 'workshops'
    and (
      exists (
        select 1 from public.profiles
        where id = auth.uid()
        and membership_status in ('member', 'paused')
      )
      or is_admin()
    )
  );

create policy "workshops storage: admin write"
  on storage.objects for insert
  with check (bucket_id = 'workshops' and is_admin());

create policy "workshops storage: admin delete"
  on storage.objects for delete
  using (bucket_id = 'workshops' and is_admin());
