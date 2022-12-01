-- Verify tet:evaluation/score_service on pg

BEGIN;

select has_function_privilege('evaluation.convert_statut(action_id, avancement, numeric[], boolean)', 'execute');

ROLLBACK;
