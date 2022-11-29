-- Verify tet:pg_net_extension on pg

BEGIN;

select has_function_privilege('net.http_get(text, jsonb, jsonb, int)', 'execute');

ROLLBACK;
