-- Revert tet:indicateur/indicateur_terristory_json from pg

BEGIN;

drop table indicateur_terristory_json;

COMMIT;
