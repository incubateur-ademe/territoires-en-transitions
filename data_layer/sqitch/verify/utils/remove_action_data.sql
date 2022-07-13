-- Verify tet:utils/remove_action_data on pg

BEGIN;

select has_function_privilege('private.remove_action_data(action_id)', 'execute');

ROLLBACK;
