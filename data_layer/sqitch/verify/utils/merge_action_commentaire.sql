-- Verify tet:utils/merge_action_commentaire on pg

BEGIN;

select has_function_privilege('private.merge_action_commentaire(action_id, action_id)', 'execute');

ROLLBACK;
