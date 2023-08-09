-- Verify tet:evaluation/score_service on pg

BEGIN;

select has_function_privilege('evaluation.evaluation_payload(integer, referentiel)', 'execute');


ROLLBACK;
