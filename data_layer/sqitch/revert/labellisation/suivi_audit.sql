-- Revert tet:labellisation/suivi_audit from pg

BEGIN;

drop view suivi_audit;

COMMIT;
