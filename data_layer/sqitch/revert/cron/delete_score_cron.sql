-- Revert tet:cron/delete_score_cron from pg

BEGIN;

select cron.schedule('update_late_scores',
                     '*/5 * * * *', -- toutes les 5 minutes
                     $$select evaluation.update_late_collectivite_scores(20);$$);

select cron.schedule('verification_scores',
                     '0 3 * * *', -- every day
                     $$select automatisation.verification_scores();$$);

COMMIT;
