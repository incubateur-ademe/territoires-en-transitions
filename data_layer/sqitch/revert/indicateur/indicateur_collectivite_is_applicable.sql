-- Revert tet:indicateur/indicateur_collectivite_is_applicable from pg

BEGIN;

alter table indicateur_collectivite
    drop column is_applicable;

COMMIT;
