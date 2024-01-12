-- Verify tet:automatisation/newsletters on pg

BEGIN;

select has_function_privilege('automatisation.send_admin_edl_complete()', 'execute');

ROLLBACK;
