-- Revert tet:evaluation/score_summary from pg

BEGIN;

drop function private.score_summary_of(score private.action_score);
drop function private.convert_client_scores(scores jsonb);
drop table private.action_score;

COMMIT;
