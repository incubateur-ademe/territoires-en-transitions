-- Revert tet:retool/evaluation from pg

BEGIN;

drop view retool_completude_compute;
drop view retool_score;
drop view retool_completude;

COMMIT;
