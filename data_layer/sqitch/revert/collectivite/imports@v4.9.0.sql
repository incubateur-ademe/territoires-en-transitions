-- Revert tet:imports from pg

BEGIN;

drop table imports.commune;
drop table imports.banatic;
drop table imports.departement;
drop table imports.region;

drop type nature;

drop domain codegeo;
drop domain siren;

drop schema raw;
drop schema imports;

COMMIT;
