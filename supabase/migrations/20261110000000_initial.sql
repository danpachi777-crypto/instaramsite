begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function public.valid_motion_media(value text) returns boolean
language sql immutable set search_path = '' as $$
 select value is null or (
  char_length(value) <= 2048 and (
   value ~ '^/demo/[a-zA-Z0-9/_-]+\.(svg|png|jpg|jpeg|webp|avif|mp4|webm)$'
   or value ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.:-]*([/?][^[:space:]#]*)?$'
  )
 );
$$;
revoke all on function public.valid_motion_media(text) from public;
grant execute on function public.valid_motion_media(text) to service_role;

create table public.templates (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (char_length(slug) between 1 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (char_length(btrim(title)) between 1 and 80),
 description text not null check (char_length(btrim(description)) between 1 and 500),
 category text not null check (category in ('fashion','product','lifestyle','cinematic','effects')),
 preview_url text check (public.valid_motion_media(preview_url)),
 poster_url text check (public.valid_motion_media(poster_url)),
 aspect_ratio text not null default '9:16' check (aspect_ratio in ('9:16','1:1','16:9','4:5')),
 is_published boolean not null default false,
 sort_order integer not null default 0 check (sort_order between -100000 and 100000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint video_has_poster check (preview_url is null or poster_url is not null)
);
create index templates_public_order_idx on public.templates (sort_order, created_at) where is_published;
create function private.touch_template() returns trigger language plpgsql set search_path = '' as $$
 begin new.updated_at := now(); return new; end;
$$;
revoke all on function private.touch_template() from public, anon, authenticated;
create trigger templates_updated before update on public.templates for each row execute function private.touch_template();

create table public.subscribers (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (email = lower(btrim(email)) and char_length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 template_id uuid references public.templates(id) on delete set null,
 source text not null check (source in ('hero','footer','template')),
 utm_source text check (char_length(utm_source) <= 100 and utm_source !~ '[[:cntrl:]]'),
 utm_medium text check (char_length(utm_medium) <= 100 and utm_medium !~ '[[:cntrl:]]'),
 utm_campaign text check (char_length(utm_campaign) <= 100 and utm_campaign !~ '[[:cntrl:]]'),
 utm_content text check (char_length(utm_content) <= 100 and utm_content !~ '[[:cntrl:]]'),
 consent_at timestamptz not null default now(),
 consent_version text not null check (char_length(consent_version) between 1 and 50),
 created_at timestamptz not null default now()
);
create index subscribers_created_idx on public.subscribers (created_at desc, id desc);
create index subscribers_template_created_idx on public.subscribers (template_id, created_at desc, id desc);
create function private.normalize_email() returns trigger language plpgsql set search_path = '' as $$
 begin new.email := lower(btrim(new.email)); return new; end;
$$;
revoke all on function private.normalize_email() from public, anon, authenticated;
create trigger subscribers_normalize before insert or update on public.subscribers for each row execute function private.normalize_email();

create table private.rate_limits (
 key text primary key check (char_length(key) <= 100),
 attempts integer not null default 1,
 expires_at timestamptz not null
);
create index rate_limits_expiry_idx on private.rate_limits (expires_at);
alter table public.templates enable row level security;
alter table public.subscribers enable row level security;
alter table private.rate_limits enable row level security;
revoke all on public.templates, public.subscribers, private.rate_limits from public, anon, authenticated;
grant select on public.templates to anon, authenticated;
create policy published_templates on public.templates for select to anon, authenticated using (is_published = true);
grant all on public.templates, public.subscribers to service_role;

create function public.consume_rate_limit(p_key text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
 declare n integer;
 begin
  if p_key !~ '^(waitlist|login):[a-f0-9]{64}$' or p_limit not between 1 and 20 then raise exception 'invalid input' using errcode = '22023'; end if;
  delete from private.rate_limits where expires_at < now();
  insert into private.rate_limits as r (key, attempts, expires_at) values (p_key, 1, now() + interval '30 minutes')
  on conflict (key) do update set attempts = least(r.attempts + 1, p_limit + 1)
  returning attempts into n;
  return n <= p_limit;
 end;
$$;
revoke all on function public.consume_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer) to service_role;

create function public.register_subscriber(p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
 declare template uuid := nullif(p_data->>'template_id', '')::uuid;
 begin
  if p_data->>'source' = 'template' and template is null then raise exception 'invalid template' using errcode = '22023'; end if;
  if template is not null then
   -- Lock publication state through the insert, including concurrent unpublishing.
   perform id from public.templates where id = template and is_published = true for share;
   if not found then raise exception 'invalid template' using errcode = '22023'; end if;
  end if;
  insert into public.subscribers (email, template_id, source, utm_source, utm_medium, utm_campaign, utm_content, consent_at, consent_version, created_at)
  values (p_data->>'email', template, p_data->>'source', p_data->>'utm_source', p_data->>'utm_medium', p_data->>'utm_campaign', p_data->>'utm_content', now(), p_data->>'consent_version', now())
  on conflict (email) do nothing;
 end;
$$;
revoke all on function public.register_subscriber(jsonb) from public, anon, authenticated;
grant execute on function public.register_subscriber(jsonb) to service_role;

create function public.export_subscribers(p_template uuid default null, p_from timestamptz default null, p_until timestamptz default null) returns jsonb
language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc, s.id desc), '[]'::jsonb) from (
  select * from public.subscribers
  where (p_template is null or template_id = p_template)
    and (p_from is null or created_at >= p_from)
    and (p_until is null or created_at < p_until)
  order by created_at desc, id desc limit 10001
 ) s;
$$;
revoke all on function public.export_subscribers(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.export_subscribers(uuid, timestamptz, timestamptz) to service_role;
commit;
