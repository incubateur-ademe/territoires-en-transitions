-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('upsert_fiche_action()', 'execute');

ROLLBACK;