-- Verify tet:dcp on pg

BEGIN;

select has_function_privilege('after_insert_dcp_add_rights()', 'execute');

ROLLBACK;
