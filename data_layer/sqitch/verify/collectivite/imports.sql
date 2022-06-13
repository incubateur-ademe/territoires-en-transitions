-- Verify tet:imports on pg

BEGIN;

select pg_catalog.has_schema_privilege('raw', 'usage');
select pg_catalog.has_schema_privilege('imports', 'usage');

select code, population, libelle, drom
from imports.region where false;

select code, region_code, population, libelle
from imports.departement where false;

select code, region_code, departement_code, libelle, population
from imports.commune where false;

select siren, libelle, region_code, departement_code, nature, population
from imports.banatic where false;

ROLLBACK;

