-- Deploy tet:retool/evaluation to pg

BEGIN;

drop view retool_preuves;
drop view retool_score;

COMMIT;
