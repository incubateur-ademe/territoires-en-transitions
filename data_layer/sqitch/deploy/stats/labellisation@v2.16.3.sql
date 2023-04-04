-- Deploy tet:stats/labellisation to pg

BEGIN;

create view stats_labellisation_par_niveau
as
select referentiel, etoiles, count(*) as labellisations
from labellisation
group by referentiel, etoiles;

COMMIT;
