-- Verify tet:referentiel/business_update on pg

BEGIN;

select has_function_privilege('business_upsert_indicateurs(indicateur_definition[], indicateur_action[])', 'execute');
select has_function_privilege('business_update_actions(action_definition[], action_computed_points[])', 'execute');
select has_function_privilege('business_insert_actions(action_relation[], action_definition[], action_computed_points[])', 'execute');

ROLLBACK;
