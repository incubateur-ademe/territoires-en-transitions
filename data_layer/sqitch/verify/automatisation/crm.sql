-- Verify tet:utils/automatisation on pg

BEGIN;

select has_function_privilege('automatisation.send_collectivite_plan_action_json_n8n()', 'execute');
select has_function_privilege('automatisation.send_delete_collectivite_membre_json_n8n()', 'execute');


ROLLBACK;
