-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('set_fiche_action_modified_at_and_by()', 'execute');

ROLLBACK;
