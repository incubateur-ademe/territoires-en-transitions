-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('fiche_resume(fiche_action_action)', 'execute');

ROLLBACK;
