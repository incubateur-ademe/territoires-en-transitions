-- Verify tet:action_statut on pg

BEGIN;

select has_function_privilege('private.check_avancement_detaille_sum()', 'execute');

ROLLBACK;
