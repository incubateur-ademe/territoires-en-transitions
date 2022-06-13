-- Revert tet:retool/labellisation from pg

BEGIN;

drop view retool_labellisation_demande;
drop view retool_labellisation;

COMMIT;
