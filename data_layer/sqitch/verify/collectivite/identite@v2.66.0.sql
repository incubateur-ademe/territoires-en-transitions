-- Verify tet:collectivite/identite on pg

BEGIN;

select collectivite_id,
       nom,
       type_collectivite,
       code_siren_insee,
       region_name,
       departement_name,
       population_source,
       population_totale,
       is_cot
from collectivite_carte_identite
where false;

ROLLBACK;
