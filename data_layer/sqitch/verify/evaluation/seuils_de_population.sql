-- Verify tet:evaluation/seuils_de_population on pg

BEGIN;

select has_function_privilege('private.population_buckets(integer)', 'execute');

ROLLBACK;
