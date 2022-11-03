-- Deploy tet:cron/update_late_scores to pg

BEGIN;

-- 20 collectivités en retard toutes les 5 minutes = 240 collectivités par heure
select cron.schedule('update_late_scores',
                     '*/5 * * * *', -- toutes les 5 minutes
                     $$select evaluation.update_late_collectivite_scores(20);$$);


COMMIT;
