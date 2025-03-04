-- Verify tet:labellisation/labellisation on pg

BEGIN;

select collectivite_id,
       nom,
       type_collectivite,
       nature_collectivite,
       code_siren_insee,
       region_name,
       region_code,
       departement_name,
       departement_code,
       population_totale,
       departement_iso_3166,
       region_iso_3166,
       referentiel,
       etoiles,
       score_programme,
       score_realise,
       annee
from stats_derniere_labellisation
where false;

ROLLBACK;
