-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation_cloturer_audit(integer, timestamptz)', 'execute');

ROLLBACK;
