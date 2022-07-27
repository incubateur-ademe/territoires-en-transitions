-- Revert tet:utils/maintenance from pg

BEGIN;

drop view ongoing_maintenance;
drop table maintenance; 

COMMIT;
