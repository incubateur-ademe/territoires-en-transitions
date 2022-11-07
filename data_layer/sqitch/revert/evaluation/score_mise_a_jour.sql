-- Revert tet:evaluation/score_mise_a_jour from pg

BEGIN;

drop function evaluation.update_late_collectivite_scores(max int);
drop view evaluation.late_collectivite;
drop view evaluation.content_latest_update;
drop view evaluation.collectivite_latest_update;
drop type evaluation.update;

alter table client_scores
    rename column modified_at to score_created_at;
drop trigger modified_at on client_scores;

COMMIT;
