-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation.upsert_action_audit()', 'execute');

ROLLBACK;
