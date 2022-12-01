-- Verify tet:referentiel/action_definition on pg

BEGIN;

select definitions, children, created_at
from referentiel_json
where false;

select has_function_privilege('private.upsert_actions(jsonb, jsonb)', 'execute');
select has_function_privilege('private.upsert_referentiel_after_json_insert()', 'execute');

ROLLBACK;
