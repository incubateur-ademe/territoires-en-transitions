-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('upsert_fiche_action()', 'execute');
select has_function_privilege('create_fiche(int, int, action_id, indicateur_id, int)', 'execute');

ROLLBACK;
