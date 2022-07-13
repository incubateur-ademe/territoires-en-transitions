-- Verify tet:cron/refresh_collectivite_card on pg

BEGIN;

select 1/count(*) from cron.job where jobname = 'refresh_collectivite_card';

ROLLBACK;
