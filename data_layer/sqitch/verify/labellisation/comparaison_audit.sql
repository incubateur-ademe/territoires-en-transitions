-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select has_function_privilege('supprimer_score_avant_audit()', 'execute');

ROLLBACK;
