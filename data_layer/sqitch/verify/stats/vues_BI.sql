-- Verify tet:stats/vues_BI on pg

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
       geojson
from public.stats_carte_collectivite_active where false;

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
       geojson
from stats.carte_collectivite_active where false;

ROLLBACK;
