-- Verify tet:http_extension on pg

BEGIN;

select has_function_privilege('http_post(varchar, varchar, varchar)', 'execute');

ROLLBACK;
