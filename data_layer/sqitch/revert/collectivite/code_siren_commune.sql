-- Revert tet:collectivite/code_siren_commune from pg

BEGIN;

drop table imports.code_siren_commune;

COMMIT;
