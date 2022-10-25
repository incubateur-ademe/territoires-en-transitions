-- Verify tet:indicateur/json_content on pg

BEGIN;

select indicateurs, created_at
from indicateurs_json
where false;

select has_function_privilege('private.upsert_indicateurs(jsonb)', 'execute');
select has_function_privilege('private.upsert_indicateurs_after_json_insert()', 'execute');

ROLLBACK;
