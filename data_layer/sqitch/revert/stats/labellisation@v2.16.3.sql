-- Revert tet:stats/labellisation from pg

BEGIN;

drop view stats_labellisation_par_niveau;

COMMIT;
