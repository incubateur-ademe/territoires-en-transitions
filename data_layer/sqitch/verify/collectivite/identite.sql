-- Verify tet:collectivite/identite on pg

BEGIN;

select collectivite_id,
       nom,
       type_collectivite,
       code_siren_insee,
       region_name,
       departement_name,
       population_source,
       population_totale
from collectivite_carte_identite
where false;

select id, population, type, localisation
from collectivite_identite
where false;

select has_function_privilege('private.population_buckets(integer)', 'execute');
select has_function_privilege('private.collectivite_type(integer)', 'execute');

ROLLBACK;
