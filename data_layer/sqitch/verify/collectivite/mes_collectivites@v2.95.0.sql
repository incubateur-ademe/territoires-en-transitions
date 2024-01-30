-- Verify tet:mes_collectivite on pg

BEGIN;

select has_function_privilege('collectivite_user_list(integer)', 'execute');
select has_function_privilege('remove_user_from_collectivite(integer, uuid)', 'execute');

ROLLBACK;
