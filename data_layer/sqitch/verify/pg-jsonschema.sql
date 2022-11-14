-- Verify tet:pg-jsonschema on pg

BEGIN;

select has_function_privilege('jsonb_matches_schema(json, jsonb)', 'execute');

ROLLBACK;
