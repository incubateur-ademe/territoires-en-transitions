-- Revert tet:referentiel/verification_score from pg

BEGIN;

DROP FUNCTION IF EXISTS automatisation.verification_scores;

select cron.unschedule('verification_scores');

DROP TABLE IF EXISTS config.service_configurations;
DROP SCHEMA IF EXISTS config;

COMMIT;
