-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select has_function_privilege('have_admin_acces(integer)', 'execute');
select has_function_privilege('have_edition_acces(integer)', 'execute');
select has_function_privilege('have_lecture_acces(integer)', 'execute');

ROLLBACK;
