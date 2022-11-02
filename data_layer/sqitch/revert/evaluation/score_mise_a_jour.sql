-- Revert tet:evaluation/score_mise_a_jour from pg

BEGIN;

drop function private.update_late_collectivite_scores(max int);
drop view private.late_collectivite;
drop view private.content_latest_update;
drop view private.collectivite_latest_update;
drop type private.update;

COMMIT;
