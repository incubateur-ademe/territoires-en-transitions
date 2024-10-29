-- Verify tet:labellisation/preuve_v2 on pg

BEGIN;

select has_function_privilege('preuve_count(integer, action_id)', 'execute');

ROLLBACK;
