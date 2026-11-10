-- Supabase Dashboardで pg_cron を有効にした後、postgres管理接続で実行。
-- 生IPは一切保存しない。HMAC識別子の期限は最長30分、掃除は5分ごと。
create extension if not exists pg_cron;
do $$
begin
 if exists (select 1 from cron.job where jobname = 'motion-clean-rate-limits') then
  perform cron.unschedule('motion-clean-rate-limits');
 end if;
end $$;
select cron.schedule('motion-clean-rate-limits', '*/5 * * * *',
 $$delete from private.rate_limits where expires_at < now();$$);
