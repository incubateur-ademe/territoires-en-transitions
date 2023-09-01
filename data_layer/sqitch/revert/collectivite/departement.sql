-- Deploy tet:collectivite/departement to pg
-- requires: collectivite/imports

BEGIN;

create or replace view departement(code, libelle, region_code) as
SELECT departement.code,
       departement.libelle,
       departement.region_code
FROM imports.departement
where is_authenticated()
ORDER BY departement.code;

COMMIT;
