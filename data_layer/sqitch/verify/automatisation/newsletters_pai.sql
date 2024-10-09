-- Verify tet:automatisation/newsletters_pai on pg

BEGIN;

select has_function_privilege('automatisation.send_user_newsletters_new_pai()', 'execute');

ROLLBACK;
