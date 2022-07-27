-- Verify tet:evaluation/score_summary on pg

BEGIN;

select *
from private.action_score
where false;

select has_function_privilege('private.convert_client_scores(jsonb)', 'execute');
select has_function_privilege('private.score_summary_of(private.action_score)', 'execute');

ROLLBACK;
