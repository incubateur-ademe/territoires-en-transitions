-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation_peut_commencer_audit(integer, referentiel)', 'execute');

ROLLBACK;
