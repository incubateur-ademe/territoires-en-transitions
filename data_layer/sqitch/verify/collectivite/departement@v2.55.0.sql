-- Verify tet:collectivite/departement on pg

BEGIN;

select code, libelle, region_code
from departement
where false;

ROLLBACK;
