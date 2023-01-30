-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation.update_audit()', 'execute');

ROLLBACK;
