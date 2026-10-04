-- AirDesk initial schema. Run once in Supabase SQL Editor.
-- All table/function names are prefixed. Existing tennis-club tables are untouched.
-- Prefer a separate Supabase project for this business workspace.
begin;
create table if not exists public.airdesk_customers (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 150),
 phone text not null default '', email text not null default '', address text not null
);
create table if not exists public.airdesk_jobs (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.airdesk_customers(id),
 type text not null check(type in ('Installation','Service','Repair','Maintenance','Other')),
 status text not null check(status in ('Quote','In Progress','Completed')),
 title text not null check(char_length(title) between 1 and 180), notes text not null default '',
 scheduled_at timestamptz, duration integer not null default 60 check(duration between 15 and 1440),
 created_at timestamptz not null default now()
);
create table if not exists public.airdesk_assets (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.airdesk_jobs(id),
 name text not null, mime text not null, kind text not null check(kind in ('photo','file')),
 size bigint not null check(size between 1 and 15728640),
 state text not null default 'pending' check(state in ('pending','ready')),
 created_at timestamptz not null default now()
);
create index if not exists airdesk_jobs_customer_idx on public.airdesk_jobs(customer_id);
create index if not exists airdesk_jobs_schedule_idx on public.airdesk_jobs(scheduled_at);
create index if not exists airdesk_assets_job_idx on public.airdesk_assets(job_id);
alter table public.airdesk_customers enable row level security;
alter table public.airdesk_jobs enable row level security;
alter table public.airdesk_assets enable row level security;
-- No direct browser/anonymous access. The server validates the owner before using its secret.
revoke all on public.airdesk_customers,public.airdesk_jobs,public.airdesk_assets from anon,authenticated;
grant all on public.airdesk_customers,public.airdesk_jobs,public.airdesk_assets to service_role;
insert into storage.buckets(id,name,public,file_size_limit)
values('airdesk-files','airdesk-files',false,15728640)
on conflict(id) do update set public=false,file_size_limit=15728640;

create or replace function public.airdesk_save_job(payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 job_id uuid := coalesce((payload->>'id')::uuid,gen_random_uuid());
 customer_id uuid := coalesce((payload->>'customer_id')::uuid,gen_random_uuid());
begin
 if payload->>'id' is not null and not exists(select 1 from public.airdesk_jobs where id=job_id) then
  raise exception 'Job not found';
 end if;
 if payload->>'customer_id' is not null and not exists(select 1 from public.airdesk_customers where id=customer_id) then
  raise exception 'Customer not found';
 end if;
 insert into public.airdesk_customers(id,name,phone,email,address)
 values(customer_id,payload->>'name',payload->>'phone',payload->>'email',payload->>'address')
 on conflict(id) do update set name=excluded.name,phone=excluded.phone,email=excluded.email,address=excluded.address;
 insert into public.airdesk_jobs(id,customer_id,type,status,title,notes,scheduled_at,duration)
 values(job_id,customer_id,payload->>'type',payload->>'status',payload->>'title',payload->>'notes',(payload->>'scheduled_at')::timestamptz,(payload->>'duration')::integer)
 on conflict(id) do update set customer_id=excluded.customer_id,type=excluded.type,status=excluded.status,title=excluded.title,notes=excluded.notes,scheduled_at=excluded.scheduled_at,duration=excluded.duration;
 return job_id;
end $$;
revoke all on function public.airdesk_save_job(jsonb) from public,anon,authenticated;
grant execute on function public.airdesk_save_job(jsonb) to service_role;

create or replace function public.airdesk_finish_asset(asset_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.airdesk_assets%rowtype; meta jsonb;
begin
 select * into a from public.airdesk_assets where id=asset_id;
 if not found then raise exception 'File not found'; end if;
 if a.state='ready' then return asset_id; end if;
 select metadata into meta from storage.objects where bucket_id='airdesk-files' and name=asset_id::text;
 if meta is null then raise exception 'Upload not complete'; end if;
 if (meta->>'size')::bigint is distinct from a.size then raise exception 'File size mismatch'; end if;
 if a.kind='photo' and coalesce(meta->>'mimetype','') not in ('image/jpeg','image/png','image/webp','image/gif') then raise exception 'Invalid photo type'; end if;
 update public.airdesk_assets set state='ready',mime=coalesce(meta->>'mimetype',a.mime) where id=asset_id;
 return asset_id;
end $$;
revoke all on function public.airdesk_finish_asset(uuid) from public,anon,authenticated;
grant execute on function public.airdesk_finish_asset(uuid) to service_role;
commit;
