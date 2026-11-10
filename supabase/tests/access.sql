-- 既存のマイグレーションが適用済みの検証専用DBで実行。最後に必ずROLLBACK。
begin;
insert into public.templates(id,slug,title,description,category,is_published) values
 ('11111111-1111-4111-8111-111111111111','motion-test-public','公開の見本','テスト専用','fashion',true),
 ('22222222-2222-4222-8222-222222222222','motion-test-draft','非公開の見本','テスト専用','fashion',false);
set local role anon;
do $$
begin
 if (select count(*) from public.templates where slug like 'motion-test-%') <> 1 then raise exception 'RLS: draft exposed'; end if;
 begin perform * from public.subscribers; raise exception 'subscribers readable'; exception when insufficient_privilege then null; end;
 begin insert into public.subscribers(email,source,consent_version) values ('rls-test@example.invalid','hero','test'); raise exception 'subscribers insertable'; exception when insufficient_privilege then null; end;
 begin update public.templates set is_published=true where slug='motion-test-draft'; raise exception 'templates mutable'; exception when insufficient_privilege then null; end;
 begin perform public.consume_rate_limit('waitlist:' || repeat('a',64),5); raise exception 'rate RPC public'; exception when insufficient_privilege then null; end;
 begin perform public.register_subscriber('{}'::jsonb); raise exception 'register RPC public'; exception when insufficient_privilege then null; end;
 begin perform public.export_subscribers(); raise exception 'export RPC public'; exception when insufficient_privilege then null; end;
 begin perform * from private.rate_limits; raise exception 'rate table public'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$
begin
 if (select count(*) from public.templates where slug like 'motion-test-%') <> 1 then raise exception 'authenticated: draft exposed'; end if;
 begin perform * from public.subscribers; raise exception 'authenticated subscriber access'; exception when insufficient_privilege then null; end;
 begin insert into public.subscribers(email,source,consent_version) values ('rls-test@example.invalid','hero','test'); raise exception 'authenticated subscriber insert'; exception when insufficient_privilege then null; end;
 begin perform public.consume_rate_limit('waitlist:' || repeat('a',64),5); raise exception 'authenticated rate RPC'; exception when insufficient_privilege then null; end;
 begin perform public.register_subscriber('{}'::jsonb); raise exception 'authenticated register RPC'; exception when insufficient_privilege then null; end;
 begin perform public.export_subscribers(); raise exception 'authenticated export RPC'; exception when insufficient_privilege then null; end;
 begin perform * from private.rate_limits; raise exception 'authenticated rate table'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
select public.register_subscriber('{"email":" First@Example.invalid ","source":"template","template_id":"11111111-1111-4111-8111-111111111111","utm_source":"instagram","consent_version":"test-v1"}'::jsonb);
select public.register_subscriber('{"email":"first@example.invalid","source":"footer","utm_source":"other","consent_version":"test-v2"}'::jsonb);
do $$
declare s public.subscribers; n integer;
begin
 select * into strict s from public.subscribers where email = 'first@example.invalid';
 if s.source <> 'template' or s.utm_source <> 'instagram' or s.consent_version <> 'test-v1' or s.template_id <> '11111111-1111-4111-8111-111111111111'::uuid then raise exception 'duplicate overwrote first attribution'; end if;
 if s.consent_at is null or s.created_at is null then raise exception 'server timestamp missing'; end if;
 begin perform public.register_subscriber('{"email":"draft@example.invalid","source":"template","template_id":"22222222-2222-4222-8222-222222222222","consent_version":"test-v1"}'); raise exception 'draft accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.register_subscriber('{"email":"missing@example.invalid","source":"template","template_id":"33333333-3333-4333-8333-333333333333","consent_version":"test-v1"}'); raise exception 'missing accepted'; exception when invalid_parameter_value then null; end;
 for n in 1..5 loop
  if not public.consume_rate_limit('waitlist:' || repeat('b',64),5) then raise exception 'rate limited early'; end if;
 end loop;
 if public.consume_rate_limit('waitlist:' || repeat('b',64),5) then raise exception 'rate limit failed'; end if;
end $$;
reset role;
update public.templates set is_published=false where id='11111111-1111-4111-8111-111111111111';
set local role anon;
do $$ begin if exists(select 1 from public.templates where slug like 'motion-test-%') then raise exception 'unpublished row exposed'; end if; end $$;
reset role;
-- RLSそのものも確認：SELECT権限だけ一時的に与えても登録者は0行。
grant select, insert on public.subscribers to anon, authenticated;
set local role anon;
do $$ begin
 if exists(select 1 from public.subscribers) then raise exception 'subscriber RLS failed'; end if;
 begin insert into public.subscribers(email,source,consent_version) values ('rls-insert@example.invalid','hero','test'); raise exception 'subscriber insert RLS failed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 if exists(select 1 from public.subscribers) then raise exception 'authenticated subscriber RLS failed'; end if;
 begin insert into public.subscribers(email,source,consent_version) values ('rls-insert@example.invalid','hero','test'); raise exception 'authenticated insert RLS failed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
