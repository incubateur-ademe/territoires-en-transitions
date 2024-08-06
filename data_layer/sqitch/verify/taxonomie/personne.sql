-- Verify tet:taxonomie/personnes on pg

BEGIN;

select has_function_privilege('personnes_collectivite(integer)', 'execute');

ROLLBACK;
