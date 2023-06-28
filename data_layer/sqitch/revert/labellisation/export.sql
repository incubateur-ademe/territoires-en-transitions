-- Revert tet:labellisation/export from pg

BEGIN;

drop view public.export_score_audit;
drop materialized view labellisation.export_score_audit;

COMMIT;
