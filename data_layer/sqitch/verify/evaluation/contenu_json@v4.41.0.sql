-- Verify tet:evaluation/contenu_json on pg

BEGIN;

select questions, regles, created_at
from personnalisations_json
where false;
select has_function_privilege('private.upsert_questions(jsonb[])', 'execute');
select has_function_privilege('private.upsert_regles(jsonb[])', 'execute');
select has_function_privilege('private.upsert_personnalisations_after_json_insert()', 'execute');
comment on trigger upsert_personnalisations on personnalisations_json is null;

ROLLBACK;
