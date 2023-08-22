-- Verify tet:indicateur/json_content on pg

BEGIN;

select has_function_privilege('private.upsert_indicateurs(jsonb)', 'execute');

ROLLBACK;
