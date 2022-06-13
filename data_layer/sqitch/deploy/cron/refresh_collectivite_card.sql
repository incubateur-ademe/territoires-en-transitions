-- Deploy tet:cron/refresh_collectivite_card to pg
-- requires: cron/cron
-- requires: collectivite/toutes_les_collectivites

BEGIN;

select cron.schedule('refresh_collectivite_card',
                     '0 0 * * *', -- every day
                     $$refresh materialized view collectivite_card$$);

COMMIT;
