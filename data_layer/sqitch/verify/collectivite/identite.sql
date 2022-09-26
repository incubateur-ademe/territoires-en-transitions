-- Verify tet:collectivite/identite on pg

BEGIN;

select has_function_privilege('private.collectivite_type(integer)', 'execute');

ROLLBACK;
