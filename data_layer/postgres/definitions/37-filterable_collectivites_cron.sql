create extension if not exists pg_cron;

select cron.schedule('refresh_collectivite_card',
                     '0 0 * * *', -- every day
                     $$refresh materialized view collectivite_card$$);
