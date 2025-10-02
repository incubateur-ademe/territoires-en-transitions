-- Revert tet:indicateur/add-modified-fields-to-indicateur-collectivite from pg

BEGIN;

alter table indicateur_collectivite
    drop column modified_by;

alter table indicateur_collectivite
    drop column modified_at;

COMMIT;
