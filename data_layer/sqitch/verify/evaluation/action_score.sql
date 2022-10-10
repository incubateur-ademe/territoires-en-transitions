-- Verify tet:evaluation/action_score on pg

BEGIN;

select has_function_privilege('private.action_score(integer, referentiel)', 'execute');

ROLLBACK;
