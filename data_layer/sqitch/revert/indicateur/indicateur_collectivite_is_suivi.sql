-- Revert tet:indicateur/indicateur_collectivite_is_suivi from pg

BEGIN;

alter table indicateur_collectivite
    drop column is_suivi;

COMMIT;
