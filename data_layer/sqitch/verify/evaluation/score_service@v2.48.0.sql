-- Verify tet:evaluation/score_service on pg

BEGIN;

select has_function_privilege('evaluation.current_service_configuration()', 'execute');
select has_function_privilege('evaluation.identite(integer)', 'execute');
select has_function_privilege('evaluation.service_regles()', 'execute');

ROLLBACK;
