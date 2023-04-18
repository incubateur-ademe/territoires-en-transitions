-- Revert tet:labellisation/cot from pg

BEGIN;

drop table cot;

COMMIT;
