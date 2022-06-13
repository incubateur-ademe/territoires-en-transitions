-- Revert tet:cron/refresh_collectivite_card from pg

BEGIN;

select cron.unschedule('refresh_collectivite_card');

COMMIT;
