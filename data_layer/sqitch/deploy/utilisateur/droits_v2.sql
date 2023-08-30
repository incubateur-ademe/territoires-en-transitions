-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;


-- Vue departement
create or replace view departement(code, libelle, region_code) as
SELECT departement.code,
       departement.libelle,
       departement.region_code
FROM imports.departement
ORDER BY departement.code;

-- Vue region
create or replace view region(code, libelle) as
SELECT region.code,
       region.libelle
FROM imports.region
ORDER BY (unaccent(region.libelle::text));

COMMIT;
