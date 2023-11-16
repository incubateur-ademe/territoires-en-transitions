-- Revert tet:indicateur/artificialisation from pg

BEGIN;

drop table indicateur_artificialisation;

COMMIT;
