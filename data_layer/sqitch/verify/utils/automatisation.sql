-- Verify tet:utils/automatisation on pg

BEGIN;

select has_function_privilege('send_users_json_n8n()', 'execute');

ROLLBACK;
