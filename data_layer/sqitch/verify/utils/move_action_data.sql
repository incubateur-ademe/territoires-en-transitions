-- Verify tet:utils/move_action_data on pg

BEGIN;

select has_function_privilege('private.move_action_data(action_id, action_id)', 'execute');

ROLLBACK;
