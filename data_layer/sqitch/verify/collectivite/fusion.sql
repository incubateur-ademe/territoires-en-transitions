-- Verify tet:collectivite/fusion on pg

BEGIN;

select id,
       created_at,
       modified_at,
       access_restreint,
       nom,
       type,
       commune_code,
       siren,
       departement_code,
       region_code,
       nature_insee,
       population
from collectivite
where false;

select id, nom, type
from collectivite_banatic_type
where false;

ROLLBACK;
