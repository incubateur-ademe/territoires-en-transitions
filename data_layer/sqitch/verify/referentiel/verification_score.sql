-- Verify tet:referentiel/verification_score on pg

BEGIN;

SELECT COUNT(*) FROM config.service_configurations;

select has_function_privilege('automatisation.verification_scores()', 'execute');

select 1/count(*) from cron.job where jobname = 'verification_scores';

ROLLBACK;
