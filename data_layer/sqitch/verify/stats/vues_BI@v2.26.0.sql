-- Verify tet:stats/vues_BI on pg

BEGIN;

select mois, collectivites
from stats.evolution_collectivite_avec_minimum_fiches
where false;

select mois, fiches
from stats.evolution_nombre_fiches
where false;

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
       fiches,
       plans
from stats.collectivite_plan_action
where false;

ROLLBACK;
