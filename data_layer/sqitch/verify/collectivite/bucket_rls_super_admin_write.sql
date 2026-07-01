-- Verify tet:collectivite/bucket_rls_super_admin_write on pg

BEGIN;

select has_function_privilege('est_super_admin()', 'execute');
select has_function_privilege('is_bucket_writer(text)', 'execute');

ROLLBACK;
