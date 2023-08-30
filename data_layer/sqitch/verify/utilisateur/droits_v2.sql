-- Verify tet:utilisateur/droits_v2 on pg

BEGIN;

select code,
       libelle,
       region_code
from departement
where false;

select code,
       libelle
from region
where false;

ROLLBACK;
