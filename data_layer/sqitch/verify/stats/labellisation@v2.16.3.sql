-- Verify tet:stats/labellisation on pg

BEGIN;

select referentiel, etoiles, labellisations
from stats_labellisation_par_niveau;

ROLLBACK;
