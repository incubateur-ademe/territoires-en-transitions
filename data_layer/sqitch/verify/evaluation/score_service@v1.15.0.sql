-- Verify tet:evaluation/score_service on pg

BEGIN;

select has_function_privilege('evaluation.evaluate_statuts( integer, referentiel, varchar )', 'execute');
select has_function_privilege('evaluation.evaluate_regles( integer, varchar, varchar )', 'execute');

ROLLBACK;
