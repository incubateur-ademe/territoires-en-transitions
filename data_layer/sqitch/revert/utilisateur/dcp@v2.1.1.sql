-- Revert tet:dcp from pg

BEGIN;

drop table dcp;

COMMIT;
