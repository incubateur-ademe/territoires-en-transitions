-- Revert tet:labellisation/export from pg

BEGIN;

drop view labellisation.export_score_audit;

COMMIT;
