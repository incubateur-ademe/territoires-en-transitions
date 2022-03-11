-- Verify tet:base on pg

begin;
select modified_at from absract_modified_at where false;
select has_function_privilege('teapot()', 'execute');
select has_function_privilege('is_authenticated()', 'execute');
select has_function_privilege('is_service_role()', 'execute');
commit;

