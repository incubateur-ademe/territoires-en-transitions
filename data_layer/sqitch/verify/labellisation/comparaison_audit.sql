-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select has_function_privilege('private.collectivite_scores_pre_audit(integer, referentiel)', 'execute');

ROLLBACK;
