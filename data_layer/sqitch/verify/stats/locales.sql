-- Verify tet:stats/locale on pg

BEGIN;

select code_region,
       code_departement,
       referentiel,
       etoiles,
       labellisations
from stats.locales_labellisation_par_niveau
where false;

select code_region,
       code_departement,
       referentiel,
       etoiles,
       labellisations
from stats_locales_labellisation_par_niveau
where false;

ROLLBACK;
