-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation.update_labellisation_after_scores()', 'execute');

ROLLBACK;
