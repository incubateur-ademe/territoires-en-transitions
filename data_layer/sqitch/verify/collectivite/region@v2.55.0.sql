-- Verify tet:collectivite/region on pg

BEGIN;

select code, libelle
from region
where false;

ROLLBACK;
